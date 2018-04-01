﻿var Addon_Id = "hotbutton";

var item = GetAddonElement(Addon_Id);

if (window.Addon == 1) {
	Addons.HotButton =
	{
		GetRect: function (hList, iItem, rc)
		{
			rc.Left = LVIR_SELECTBOUNDS;
			api.SendMessage(hList, LVM_GETITEMRECT, iItem, rc);
			rc.Left = rc.Right - Addons.HotButton.Image.GetWidth();
			rc.Top = (rc.Top + rc.Bottom - Addons.HotButton.Image.GetHeight()) / 2;
			rc.Bottom = rc.Top + Addons.HotButton.Image.GetHeight();
		}
	};

	AddEvent("ItemPostPaint2", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && pid && nmcd.uItemState & CDIS_HOT) {
			if (Addons.HotButton.Image) {
				var rc = api.Memory("RECT");
				Addons.HotButton.GetRect(hList, nmcd.dwItemSpec, rc);
				Addons.HotButton.Image.DrawEx(nmcd.hdc, rc.Left, rc.Top, 0, 0, CLR_NONE, CLR_NONE, ILD_NORMAL);
			}
		}
	});
	
	AddEvent("MouseMessage", function (Ctrl, hwnd, msg, wParam, pt)
	{
		var hList = Ctrl.hwndList;
		if (hList && msg == WM_LBUTTONDOWN) {
			var iItem = Ctrl.HitTest(pt, LVHT_ONITEM);
			if (iItem >= 0) {
				var rc = api.Memory("RECT");
				Addons.HotButton.GetRect(hList, iItem, rc);
				var ptc = pt.Clone();
				api.ScreenToClient(hList, ptc);
				if (PtInRect(rc, ptc)) {
					(function (Ctrl) { setTimeout(function ()
					{
						var Items = Ctrl.Items();
						var Item = Items.Item(iItem);
						var FolderItem = FolderMenu.Open(api.ILIsEqual(Ctrl.FolderItem.Alt, ssfRESULTSFOLDER) ? Item.Path : Item, pt.x, pt.y, "*");
						if (FolderItem) {
							FolderMenu.Invoke(FolderItem);
						}
					}, 99)})(Ctrl);
					return S_OK;
				}
			}
		}
	});
	
	//Image
	var image = te.WICBitmap();
	var s = api.PathUnquoteSpaces(ExtractMacro(te, item.getAttribute("Img")));
	if (s) {
		Addons.HotButton.Image = image.FromFile(s);
		if (Addons.HotButton.Image) {
			return;
		}
	}
	var hdc = api.GetDC(te.hwnd);
	var rc = api.Memory("RECT");
	var w = 14 * screen.logicalYDPI / 96;
	rc.Right = w;
	rc.Bottom = w;
	var hbm = api.CreateCompatibleBitmap(hdc, w, w);
	var hmdc = api.CreateCompatibleDC(hdc);
	var hOld = api.SelectObject(hmdc, hbm);
	api.Rectangle(hmdc, rc.Left, rc.Top, rc.Right, rc.Bottom);
	api.SetTextColor(hmdc, 0x333333);
	api.SetBkMode(hmdc, 1);
	var lf = api.Memory("LOGFONT");
	lf.lfFaceName = "Arial Black",
	lf.lfHeight = - w;
	var hFont = CreateFont(lf);
	var hfontOld = api.SelectObject(hmdc, hFont);
	rc.Top = -w / 4;
	api.DrawText(hmdc, "▼", -1, rc, DT_CENTER);
	api.SelectObject(hmdc, hfontOld);
	api.DeleteDC(hmdc);
	api.SelectObject(hmdc, hOld);
	Addons.HotButton.Image = image.FromHBITMAP(hbm);
	api.DeleteObject(hbm);
	api.ReleaseDC(te.hwnd, hdc);
}