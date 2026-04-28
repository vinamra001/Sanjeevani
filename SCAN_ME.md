# 📱 Sanjeevani App — Mobile Tester Dashboard

Whenever you reopen your Visual Studio Code and want to test the app on your mobile device, simply follow the two steps below and scan the QR code!

## 1. Start the Servers
You will need to open **TWO separate terminal panels** in VS Code.

**Terminal 1 (Python Backend)**
```powershell
cd Sanjeevani
.\venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
```
> *(Keep this running so the AI models and SQLite database stay alive)*

**Terminal 2 (React Native Frontend)**
```powershell
cd Sanjeevani_Frontend
npx expo start -c
```
> *(Keep this running to send the screens to your phone)*

---

## 2. Scan to Launch
Once the two commands above are running, open the **Expo Go** app on your phone and open the camera. 

*Note: Make sure your computer and phone are connected to the exact same Wi-Fi router for the IP Address (`192.168.0.106`) to work!*

<p align="center">
  <img src="./expo_qr.png" alt="Expo QR Code" width="400">
</p>

### Manual Entry
If the scanner has trouble reading the screen, you can click "Enter URL Manually" in the Expo app and type exactly: 
`exp://192.168.0.106:8081`
