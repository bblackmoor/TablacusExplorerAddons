g_Types = { Key: ["All", "List", "Tree", "Browser", "Edit", "Menus"] };

await SetTabContents(4, "", await ReadTextFile("addons\\" + Addon_Id + "\\options.html"));

SaveLocation = async function () {
	SetChanged(null, document.E);
	await SaveX("Key", document.E);
}

LoadX("Key", null, document.E);
MakeKeySelect();
