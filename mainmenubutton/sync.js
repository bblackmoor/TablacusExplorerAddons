const Addon_Id = "mainmenubutton";
const item = GetAddonElement(Addon_Id);

Sync.MainMenuButton = {
	key: 0,
	strMenus: ["&File", "&Edit", "&View", "F&avorites", "&Tools", "&Help"],

	Popup: function (Ctrl, pt) {
		if (!pt) {
			pt = api.Memory("POINT");
			api.GetCursorPos(pt);
		}
		if (Sync.MainMenuButton.nCloseId == Ctrl.Id) {
			return;
		}
		Sync.MainMenuButton.bLoop = true;
		AddEvent("ExitMenuLoop", function () {
			Sync.MainMenuButton.bLoop = false;
			Sync.MainMenuButton.nCloseId = Ctrl.Id;
			InvokeUI("Addons.MainMenuButton.ExitMenuTimer", function () {
				Sync.MainMenuButton.nCloseId = 0;
			});
		});
		g_nPos = 0;
		const hMenu = api.CreatePopupMenu();
		for (let i = Sync.MainMenuButton.strMenus.length; i--;) {
			var mii = api.Memory("MENUITEMINFO");
			mii.fMask = MIIM_STRING | MIIM_SUBMENU;
			mii.dwTypeData = GetText(Sync.MainMenuButton.strMenus[i]);
			mii.hSubMenu = api.CreatePopupMenu();
			api.InsertMenu(mii.hSubMenu, 0, MF_BYPOSITION | MF_STRING, 0, api.sprintf(99, '\tJScript\tSync.MainMenuButton.OpenSubMenu("%llx", %d)', mii.hSubMenu, i));
			api.InsertMenuItem(hMenu, 0, true, mii);
		}
		Ctrl = Ctrl || te;
		const ar = GetSelectedArray(Ctrl, pt);
		const Selected = ar.shift();
		const SelItem = ar.shift();
		const FV = ar.shift();
		ExtraMenuCommand = [];
		ExtraMenuData = [];
		eventTE.menucommand = [];

		if (!pt) {
			pt = api.Memory("POINT");
			const hwnd = api.FindWindowEx(FV.hwndView, 0, WC_LISTVIEW, null);
			if (hwnd) {
				const rc = api.Memory("RECT");
				const i = FV.GetFocusedItem;
				if (api.SendMessage(hwnd, LVM_ISITEMVISIBLE, i, 0)) {
					rc.Left = LVIR_LABEL;
					api.SendMessage(hwnd, LVM_GETITEMRECT, i, rc);
					pt.x = rc.Left;
					pt.y = (rc.Top + rc.Bottom) / 2;
				}
			}
			api.ClientToScreen(FV.hwnd, pt);
		}
		Sync.MainMenuButton.Ctrl = Ctrl;
		Sync.MainMenuButton.pt = pt;
		Sync.MainMenuButton.FV = FV;
		Sync.MainMenuButton.ContextMenu = [];
		Sync.MainMenuButton.Selected = Selected;
		Sync.MainMenuButton.SelItem = SelItem;
		Sync.MainMenuButton.uCMF = Ctrl.Type != CTRL_TV ? CMF_NORMAL | CMF_CANRENAME : CMF_EXPLORE | CMF_CANRENAME;
		Sync.MainMenuButton.arItem = {};
		if (api.GetKeyState(VK_SHIFT) < 0) {
			Sync.MainMenuButton.uCMF |= CMF_EXTENDEDVERBS;
		}
		const nVerb = api.TrackPopupMenuEx(hMenu, TPM_LEFTALIGN | TPM_LEFTBUTTON | TPM_RIGHTBUTTON | TPM_RETURNCMD, pt.x, pt.y, te.hwnd, null, Sync.MainMenuButton.ContextMenu);
		let Name = Sync.MainMenuButton.strMenus[0].replace("&", "");
		for (let i = Sync.MainMenuButton.strMenus.length; i--;) {
			api.GetMenuItemInfo(hMenu, i, true, mii);
			mii.fMask = MIIM_SUBMENU;
			if (api.GetMenuString(mii.hSubMenu, nVerb, MF_BYCOMMAND)) {
				Name = Sync.MainMenuButton.strMenus[i].replace("&", "");
			}
		}
		if (nVerb) {
			const mii = api.Memory("MENUITEMINFO");
			mii.cbSize = mii.Size;
			mii.fMask = MIIM_SUBMENU;
			const hr = ExecMenu4(Ctrl, Name, pt, hMenu, Sync.MainMenuButton.ContextMenu, nVerb, Sync.MainMenuButton.FV);
			if (isFinite(hr)) {
				return hr;
			}
			const item = Sync.MainMenuButton.arItem[nVerb - 1];
			if (item) {
				const s = item.getAttribute("Type");
				Exec(Ctrl, item.text, window.g_menu_button == 3 && SameText(s, "Open") ? "Open in new tab" : s, Ctrl.hwnd, pt);
				return S_OK;
			}
		} else {
			api.DestroyMenu(hMenu);
		}
	},

	Exec: function (Ctrl, pt) {
		Sync.MainMenuButton.Popup(Ctrl, pt);
		return S_OK;
	},

	OpenSubMenu: function (hSubMenu, wID) {
		const hMenu = api.sscanf(hSubMenu, "%llx");
		const Name = Sync.MainMenuButton.strMenus[wID].replace("&", "");
		let items = null;
		const menus = teMenuGetElementsByTagName(Name);
		if (menus && menus.length) {
			items = menus[0].getElementsByTagName("Item");
			const nBase = GetNum(menus[0].getAttribute("Base"));
			GetBaseMenuEx(hMenu, nBase, Sync.MainMenuButton.FV, Sync.MainMenuButton.Selected, Sync.MainMenuButton.uCMF, 0, Sync.MainMenuButton.SelItem, Sync.MainMenuButton.ContextMenu);
			if (nBase < 5) {
				AdjustMenuBreak(hMenu);
			}
			let arMenu;
			if (items) {
				arMenu = OpenMenu(items, Sync.MainMenuButton.SelItem);
				g_nPos = MakeMenus(hMenu, menus, arMenu, items, Ctrl, pt, g_nPos, Sync.MainMenuButton.arItem, true);

				const eo = eventTE[Name.toLowerCase()];
				for (let i in eo) {
					try {
						g_nPos = eo[i](Sync.MainMenuButton.Ctrl, hMenu, g_nPos, Sync.MainMenuButton.Selected, Sync.MainMenuButton.SelItem, Sync.MainMenuButton.ContextMenu[0], Name, Sync.MainMenuButton.pt);
					} catch (e) {
						ShowError(e, Name, i);
					}
				}
				for (let i in eventTE.menus) {
					try {
						g_nPos = eventTE.menus[i](Sync.MainMenuButton.Ctrl, hMenu, g_nPos, Sync.MainMenuButton.Selected, Sync.MainMenuButton.SelItem, Sync.MainMenuButton.ContextMenu[0], Name, Sync.MainMenuButton.pt);
					} catch (e) {
						ShowError(e, "Menus", i);
					}
				}
			}
		}
		api.DeleteMenu(hMenu, -2, MF_BYCOMMAND);
		AdjustMenuBreak(hMenu);
	}
};

//Key
if (item.getAttribute("KeyExec")) {
	SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Sync.MainMenuButton.Exec, "Func");
}
//Mouse
if (item.getAttribute("MouseExec")) {
	SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Sync.MainMenuButton.Exec, "Func");
}

AddTypeEx("Add-ons", "Main Menu", Sync.MainMenuButton.Exec);

AddEvent("KeyMessage", function (Ctrl, hwnd, msg, key, keydata) {
	if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN) {
		Sync.MainMenuButton.key = Sync.MainMenuButton.key != VK_MENU && (keydata & 0x40000000) ? 0 : key;
	} else if (key == VK_MENU && msg == WM_SYSKEYUP && key == Sync.MainMenuButton.key) {
		const FV = GetFolderView(Ctrl);
		InvokeUI("Addons.MainMenuButton.Popup", [null, FV.Parent.Id]);
		return S_OK;
	}
});

AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt) {
	if (msg != WM_MOUSEMOVE) {
		Sync.MainMenuButton.key = 0;
	}
});
