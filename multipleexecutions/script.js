﻿if (window.Addon == 1) {
	AddEvent("CopyData", function (Ctrl, cd, wParam)
	{
		if (Ctrl.Type == CTRL_TE && cd.dwData == 0 && cd.cbData) {
			SaveConfig();
			return S_FALSE;
		}
	});
}
