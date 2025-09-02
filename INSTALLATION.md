# Installation Guide for AibaiMall

## Prerequisites

Before installing the AibaiMall, you need to have the following software installed on your computer:

### 1. Node.js (Required)
Download and install Node.js from: https://nodejs.org/

**Recommended version**: Node.js 18.x or higher

**To verify installation**, open Command Prompt (Windows) or Terminal (Mac/Linux) and run:
```bash
node --version
npm --version
```

### 2. Git (Optional but recommended)
Download and install Git from: https://git-scm.com/

## Installation Steps

### Step 1: Download the Project
1. Download all the project files to your computer
2. Extract the files to a folder (e.g., `AibaiMall`)

### Step 2: Open Terminal/Command Prompt
1. **Windows**: Press `Win + R`, type `cmd`, press Enter
2. **Mac**: Open Terminal from Applications > Utilities
3. **Linux**: Open Terminal

### Step 3: Navigate to Project Folder
```bash
cd "path/to/AibaiMall"
```

**Example**:
```bash
cd "C:\Users\PETER JORAM\3D Objects\AibaiMall"
```

### Step 4: Install Dependencies
```bash
npm install
```

This will install all required packages. Wait for the installation to complete.

### Step 5: Start the Development Server
```bash
npm run dev
```

You should see output like:
```
> AibaiMall@1.0.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 6: Open Your Browser
Navigate to: http://localhost:3000

## Troubleshooting

### If npm is not recognized:
1. Make sure Node.js is installed correctly
2. Restart your terminal/command prompt
3. Try running: `node --version` to verify Node.js installation

### If installation fails:
1. Make sure you have internet connection
2. Try running: `npm cache clean --force`
3. Delete `node_modules` folder and `package-lock.json` file
4. Run `npm install` again

### If the website doesn't load:
1. Check if the server is running (you should see "ready started server")
2. Make sure no other application is using port 3000
3. Try a different port: `npm run dev -- -p 3001`

## Using the Website

### For Customers:
1. Browse products on the homepage
2. Add items to cart
3. Click "Cart" to view cart
4. Click "Checkout" to place order
5. Choose payment method (M-PESA, Airtel Money, Tigo Pesa)

### For Admins:
1. Click "Admin" link in the top navigation
2. Login with:
   - Username: `PETTERR`
   - Password: `54321`
3. Access dashboard features

## Stopping the Server
To stop the development server, press `Ctrl + C` in the terminal.

## Building for Production
To create a production build:
```bash
npm run build
npm start
```

## Support
If you encounter any issues:
- Check the error messages in the terminal
- Make sure all files are in the correct folders
- Verify Node.js installation
- Contact support if problems persist
