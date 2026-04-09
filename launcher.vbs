Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Fozilshox\OneDrive\Desktop\EVEREST"
REM Start the server using the batch file in hidden mode (0)
WshShell.Run "cmd /c ""C:\Users\Fozilshox\OneDrive\Desktop\EVEREST\start_everest.bat""", 0, False

