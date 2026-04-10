Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\Fozilshox\OneDrive\Desktop\everestls-main"
REM Start the server using the batch file in hidden mode (0)
WshShell.Run "cmd /c ""C:\Users\Fozilshox\OneDrive\Desktop\everestls-main\start_everest.bat""", 0, False

