const Addon_Id = "thumbnailengine";
if (window.Addon == 1) {
	const item = await GetAddonElement(Addon_Id);
	Addons.ThumbnailEngine = {
		hModule: await api.LoadLibraryEx(BuildPath(ui_.Installed, ["addons\\thumbnailengine\\thumb", ui_.bit, ".dll"].join("")), 0, 0),
		Finalize: function () {
			if (Addons.ThumbnailEngine.hModule) {
				api.FreeLibrary(Addons.ThumbnailEngine.hModule);
				delete Addons.ThumbnailEngine.hModule;
			}
		}
	}

	const hModule = Addons.ThumbnailEngine.hModule;
	if (hModule) {
		api.RunDLL(hModule, "SetFilterW", 0, 0, item.getAttribute("Filter") || "*", 1);
		api.RunDLL(hModule, "SetDisableW", 0, 0, item.getAttribute("Disable") || "-", 1);
		api.RunDLL(hModule, "SetSizeW", 0, 0, item.getAttribute("Size") || 1024, 1);
		api.RunDLL(hModule, "SetFolderW", 0, 0, !GetNum(item.getAttribute("NoFolder")), 1);
		api.RunDLL(hModule, "SetTPW", 0, 0, !GetNum(item.getAttribute("NoTP")), 1);
		api.RunDLL(hModule, "SetEIW", 0, 0, !GetNum(item.getAttribute("NoEI")), 1);

		te.AddEvent("GetImage", await api.GetProcAddress(hModule, "GetImage"));

		AddEvent("Finalize", Addons.ThumbnailEngine.Finalize);

		AddEvent("AddonDisabled", function (Id) {
			if (SameText(Id, "thumbnailengine")) {
				Addons.ThumbnailEngine.Finalize();
			}
		});
	}
} else {
	SetTabContents(0, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));
}
