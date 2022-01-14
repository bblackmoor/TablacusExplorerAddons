// Tabacus Explorer
CreateXml = function () {
	var xml = new ActiveXObject("Msxml2.DOMDocument");
	xml.async = false;
	return xml;
}

GetAddonInfo2 = function (xml, info, Tag) {
	var items = xml.getElementsByTagName(Tag);
	if (items.length) {
		var item = items[0].childNodes;
		for (var i = 0; i < item.length; i++) {
			info[item[i].tagName] = item[i].text;
		}
	}
}

var fso = new ActiveXObject("Scripting.FileSystemObject");
var wsh = new ActiveXObject("WScript.Shell");
var folder = fso.GetFolder("..");
var results = [];
var em = new Enumerator(folder.SubFolders);
var arLangs = ["General", "en", "ja", "zh"];
var arAddon = [];
for (em.moveFirst(); !em.atEnd(); em.moveNext()) {
	var name = em.item().Name;
	if (/^breadcrumbsaddressbar$|^migemo$|^iconsize$|^smallicons$|^docs$/i.test(name)) {
		continue;
	}
	var xml = new ActiveXObject("Msxml2.DOMDocument");
	xml.async = false;
	if (xml.load("..\\" + name + "\\config.xml")) {
		var info = [];
		for (var i = arLangs.length; i--;) {
			GetAddonInfo2(xml, info, arLangs[i]);
		}
		var dt = new Date(info.pubDate);
		var ver = Math.round(info.Version * 100);
		arAddon.push({
			name: name,
			order: ("0000000000000000000" + dt.getTime()).slice(-20) + (9999 - ver)
		});

		var zip = [name, "\\", name, "_", ver, ".zip"].join("");
		if (!fso.FileExists(zip)) {
			if (!fso.FolderExists(name)) {
				fso.CreateFolder(name);
			}
			wsh.Run(['"C:\\Program Files\\7-Zip\\7zG.exe"', "a", zip.replace(/\\/g, "\\\\"), "..\\" + name, "-mx9"].join(" "));
			results.push(zip);
		}
	} else if (!/^\.|_dll$/.test(name)) {
		WScript.Echo([name, fso.FileExists("..\\" + name + "\\config.xml")].join(","));
	}
}

var arSorted = arAddon.sort(function (a, b) {
	if (a.order > b.order) {
		return -1;
	}
	if (a.order < b.order) {
		return 1;
	}
	return 0;
});

var xmlSave = CreateXml();
var root = xmlSave.createElement("TablacusExplorer");
for (var i in arSorted) {
	var name = arSorted[i].name;
	var xml = new ActiveXObject("Msxml2.DOMDocument");
	xml.async = false;
	if (xml.load("..\\" + name + "\\config.xml")) {
		var item1 = xmlSave.createElement("Item");
		item1.setAttribute("Id", name);
		for (var k = 0; k < arLangs.length; k++) {
			var items = xml.getElementsByTagName(arLangs[k]);
			if (items.length) {
				var item2 = xmlSave.createElement(arLangs[k]);
				var item = items[0].childNodes;
				for (var i = 0; i < item.length; i++) {
					if (/Version$|^pubDate$|^Creator$|^Name$|^Description$/.test(item[i].tagName)) {
						var item3 = xmlSave.createElement(item[i].tagName);
						item3.text = item[i].text;
						item2.appendChild(item3);
					}
				}
				if (k == 0) {
					if (fso.FileExists('..\\..\\TablacusExplorerAddons.wiki\\' + name + '.md')) {
						var item3 = xmlSave.createElement("Details");
						item3.text = 'https://tablacus.github.io/wiki/addons/' + name + '.html';
						item2.appendChild(item3);
					}
				}
				item1.appendChild(item2);
			}
		}
		root.appendChild(item1);
	} else {
		WScript.Echo(name);
	}
}
xmlSave.appendChild(root);
var fnXml = fso.BuildPath(new ActiveXObject("WScript.Shell").CurrentDirectory, "index.xml");
xmlSave.save(fnXml);

var ado = new ActiveXObject("ADODB.Stream");
ado.Mode = 3;
ado.Type = 2;
ado.Charset = "UTF-8";
ado.Open();
ado.LoadFromFile(fnXml);
ado.Position = 0;
var strData = ado.ReadText().replace(/(<\/Item>)/ig, "$1\n");
ado.Position = 0;
ado.WriteText(strData);
ado.SaveToFile(fnXml, 2);
ado.Close();
if (results.length) {
	WScript.Echo(results.join("\n"));
}
