const Addon_Id = "labelsqliteodbc";
if (window.Addon == 1) {
	$.importScript("addons\\" + Addon_Id + "\\sync.js");
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}
