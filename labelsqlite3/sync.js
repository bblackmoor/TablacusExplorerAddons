const Addon_Id = "labelsqlite3";
const item = GetAddonElement(Addon_Id);
Sync.LabelSQLite3 = {
	DLL: api.DllGetClassObject(BuildPath(te.Data.Installed, ["addons\\labelsqlite3\\tsqlite", g_.bit, ".dll"].join("")), "{CAC858A3-6D0C-4E03-A609-880C7F04BBDA}"),
	DBFILE: BuildPath(te.Data.DataFolder, "config\\label3.db"),

	MakeList: function () {
		const db = Sync.LabelSQLite3.GetDB();
		const list = [];
		let ix = [];
		db.sqlite3_exec('SELECT label FROM labels', function (rs) {
			const ar = (rs["label"] || "").split(/\s*;\s*/);
			for (let i in ar) {
				const s = ar[i];
				if (s) {
					ix.push(s);
				}
			}
		}, api.CreateObject);
		ix = ix.sort(function (a, b) {
			return api.StrCmpLogical(b, a)
		});
		for (let i = ix.length; i--;) {
			list[ix[i]] = true;
		}
		db.sqlite3_exec("CREATE TABLE IF NOT EXISTS list (label TEXT PRIMARY KEY);");
		db.sqlite3_exec('DELETE FROM list');
		for (let i in list) {
			db.sqlite3_exec('INSERT INTO list(label) VALUES ("' + i + '");');
		}
	},

	Open: function () {
		Sync.LabelSQLite3.db = Sync.LabelSQLite3.DLL.Open(ExtractPath(te, item.getAttribute("Path" + g_.bit) || 'winsqlite3.dll'));
		if (Sync.LabelSQLite3.db && Sync.LabelSQLite3.db.sqlite3_open && Sync.LabelSQLite3.db.sqlite3_open(Sync.LabelSQLite3.DBFILE) == 0) {
			Sync.LabelSQLite3.db.sqlite3_exec("CREATE TABLE IF NOT EXISTS labels (path TEXT PRIMARY KEY, label TEXT);");
			Sync.LabelSQLite3.Open = function () { };
			AddEvent("Finalize", Sync.LabelSQLite3.Close);
			return;
		}
		Sync.LabelSQLite3.Close();
	},

	Close: function () {
		if (Sync.LabelSQLite3.db) {
			Sync.LabelSQLite3.db.sqlite3_close();
			Sync.LabelSQLite3.db = {
				sqlite3_exec: function () { return 1 },
				sqlite3_close: function () { }
			};
		}
	},

	GetDB: function () {
		if (MainWindow.Sync.LabelSQLite3.db) {
			return MainWindow.Sync.LabelSQLite3.db;
		}
		Sync.LabelSQLite3.Open();
		return Sync.LabelSQLite3.db;
	},

	Load: function (fn) {
		try {
			const db = Sync.LabelSQLite3.GetDB();
			const ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			ado.LoadFromFile(fn);
			if (!ado.EOS) {
				db.sqlite3_exec('BEGIN');
				db.sqlite3_exec('DELETE FROM labels');
				let n = 0;
				while (!ado.EOS) {
					const ar = ado.ReadText(adReadLine).replace(/"/i, "").split("\t");
					db.sqlite3_exec("INSERT INTO labels(path, label) VALUES ('" + ar[0].replace(/'/g, "''") + "','" + ar[1].replace(/'/g, "''") + "');");
					n++;
				}
				db.sqlite3_exec('COMMIT');
				Sync.LabelSQLite3.MakeList();
			}
			ado.Close();
		} catch (e) {
			ShowError(e, [GetText("Load"), fn].join(": "));
		}
	},

	Save: function (fn) {
		try {
			const db = Sync.LabelSQLite3.GetDB();
			const ado = api.CreateObject("ads");
			ado.CharSet = "utf-8";
			ado.Open();
			db.sqlite3_exec('BEGIN');
			db.sqlite3_exec('SELECT path,label FROM labels', function (rs) {
				ado.WriteText([rs["path"], rs["label"]].join("\t") + "\r\n");
			}, api.CreateObject);
			db.sqlite3_exec('COMMIT');
			ado.SaveToFile(fn, adSaveCreateOverWrite);
			ado.Close();
		} catch (e) {
			ShowError(e, [GetText("Save"), fn].join(": "));
		}
	},

	Finalize: function () {
		te.Labels = null;
		Sync.LabelSQLite3.Close()
	}
};

AddEvent("Load", function () {
	if (!Sync.Label) {
		return;
	}
	let bExists;
	try {
		bExists = fso.FileExists(Sync.LabelSQLite3.DBFILE);
		if (bExists) {
			Sync.LabelSQLite3.Open();
		} else {
			fso.CreateTextFile(Sync.LabelSQLite3.DBFILE).Close();
			Sync.LabelSQLite3.Open();
			try {
				Sync.LabelSQLite3.Load(Sync.Label.CONFIG);
			} catch (e) { }
		}
	} catch (e) {
		if (!bExists) {
			fso.DeleteFile(Sync.LabelSQLite3.DBFILE);
		}
		delete Sync.LabelSQLite3;
		return;
	}
	if (Sync.LabelSQLite3.db && Sync.LabelSQLite3.db.sqlite3_exec) {
		Sync.Label.DB = {
			Get: function (path) {
				return Sync.LabelSQLite3.db.sqlite3_exec('SELECT label FROM labels WHERE path="' + path + '"', 1) || "";
			},

			ENumCB: function (fncb) {
				Sync.LabelSQLite3.db.sqlite3_exec('SELECT path,label FROM labels', function (rs) {
					fncb(rs["path"], rs["label"] || "");
				}, api.CreateObject);
			},

			Set: function (path, s) {
				if (path) {
					const s1 = Sync.Label.DB.Get(path);
					s = s.replace(/\\?|\\*|"/g, "");
					if (s) {
						if (s1) {
							Sync.LabelSQLite3.db.sqlite3_exec("UPDATE labels SET label='" + s.replace(/'/, "''") + "' WHERE path='" + path.replace(/'/, "''") + "'");
						} else {
							Sync.LabelSQLite3.db.sqlite3_exec("INSERT INTO labels(path, label) VALUES ('" + path.replace(/'/, "''") + "','" + s.replace(/'/, "''") + "');");
						}
					} else {
						Sync.LabelSQLite3.db.sqlite3_exec("DELETE FROM labels WHERE path='" + path.replace(/'/, "''") + "'");
					}
					const fn = api.ObjGetI(this, "OnChange");
					fn && api.Invoke(fn, [path, s, s1]);
				}
			},

			Clear: function () {
				Sync.LabelSQLite3.db.sqlite3_exec('DELETE FROM labels');
				Sync.LabelSQLite3.db.sqlite3_exec("CREATE TABLE IF NOT EXISTS list (label TEXT);");
				Sync.LabelSQLite3.db.sqlite3_exec('DELETE FROM list');
				return this;
			},

			Load: function () {
				return this;
			},

			Save: function () { },
			Close: function () { }
		}
		Sync.Label.DB.DB = Sync.Label.DB.Get;
		AddEvent("Finalize", Sync.LabelSQLite3.Finalize);
		AddEventId("AddonDisabledEx", "LabelSQLite3", Sync.LabelSQLite3.Finalize);
	}
}, true);
