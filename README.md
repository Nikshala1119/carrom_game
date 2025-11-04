# 🎯 Carrom Pool PWA Game

A Progressive Web App (PWA) implementation of the classic Carrom board game. Play against the computer on any device, and install it on your Android or iPhone!

## Features

### Core Gameplay (Carrom Pool Style)
- 🎯 **Authentic Carrom Pool Experience**: Cue stick aiming with drag-back power mechanism
- 🎮 **Two-Phase Controls**: Striker placement + aiming/shooting phases
- 🎪 **Visual Cue Stick**: Rotating cue with blue tip and trajectory line
- 💪 **Dynamic Power System**: Live power bar showing shot strength
- ⚡ **Proper Piece Setup**: 9 white, 9 black, 1 red queen pieces

### Visual & Audio Effects
- ✨ **Particle Effects**: Shot trails and collision sparks
- 💫 **Pocket Animations**: Golden ring effects when pieces are pocketed
- 🔊 **Sound Effects**: Strike, collision, and pocket sounds
- 🎨 **Beautiful Graphics**: Polished board with baseline indicators

### Game Features
- 🤖 **Smart AI Opponent**: Challenging computer player
- 📊 **Score Tracking**: 10 points per piece, 50 bonus for queen
- 🏆 **Proper Rules**: Fouls, turn continuation, queen covering
- 📱 **PWA Support**: Installable on Android and iOS devices
- 🌐 **Offline Mode**: Works offline after first load
- 📐 **Realistic Physics**: Accurate collision detection and friction

## How to Play (Carrom Pool Style)

1. **Position Striker**: Drag the striker left/right along the baseline to position it
2. **Start Aiming**: Tap anywhere to lock striker position - cue stick appears
3. **Aim Direction**: Drag in any direction to rotate the cue stick and aim
4. **Set Power**: Drag back further from striker for more power - power bar shows strength
5. **Shoot**: Release to take the shot!
6. **Score**: Pocket your color pieces (white) to earn 10 points each
7. **Queen Bonus**: Pocket the red queen and then pocket one of your pieces to earn 50 bonus points
8. **Win**: First player to pocket all their pieces wins!

### Rules

- You continue playing if you pocket your own piece
- Pocketing opponent's piece or the striker is a foul
- Fouls result in skipping your turn
- Queen must be "covered" by pocketing one of your pieces after it

## Installation Instructions

### Step 1: Generate Icons

1. Open `generate-icons.html` in your browser
2. Two icons will automatically download: `icon-192.png` and `icon-512.png`
3. Place both icons in the root directory of the project

### Step 2: Run a Local Server

The PWA must be served over HTTPS (or localhost for testing). Use one of these methods:

#### Option A: Using Python (Recommended)

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: http://localhost:8000

#### Option B: Using Node.js

```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000
```

Then open: http://localhost:8000

#### Option C: Using PHP

```bash
php -S localhost:8000
```

Then open: http://localhost:8000

### Step 3: Test on Desktop

1. Open Chrome/Edge browser
2. Navigate to http://localhost:8000
3. Look for the "Install App" button in the header
4. Click to install the PWA on your desktop

### Step 4: Test on Mobile Devices

#### For Android:

1. Make sure your phone and computer are on the same network
2. Find your computer's IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig` or `ip addr`
3. On your Android device, open Chrome
4. Navigate to http://YOUR_IP_ADDRESS:8000
5. Tap the menu (three dots) → "Install app" or "Add to Home screen"

#### For iPhone/iOS:

1. Make sure your phone and computer are on the same network
2. Find your computer's IP address (see above)
3. On your iPhone, open Safari
4. Navigate to http://YOUR_IP_ADDRESS:8000
5. Tap the Share button (square with arrow)
6. Scroll and tap "Add to Home Screen"
7. Tap "Add"

### Step 5: Deploy Online (Optional)

For full PWA functionality on mobile devices, deploy to a hosting service with HTTPS:

#### Using GitHub Pages:

1. Create a new repository on GitHub
2. Push all files to the repository
3. Go to Settings → Pages
4. Select branch and save
5. Access via: https://YOUR_USERNAME.github.io/REPO_NAME

#### Using Netlify:

1. Sign up at https://www.netlify.com
2. Drag and drop your project folder
3. Get instant HTTPS URL

#### Using Vercel:

1. Sign up at https://vercel.com
2. Import your GitHub repository or drag folder
3. Get instant HTTPS URL

## File Structure

```
carrom_game/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── game.js            # Game logic, physics, and AI
├── manifest.json      # PWA manifest
├── service-worker.js  # Service worker for offline support
├── generate-icons.html # Icon generator
├── icon-192.png       # App icon 192x192 (generate this)
├── icon-512.png       # App icon 512x512 (generate this)
└── README.md          # This file
```

## Game Controls

### Desktop & Mobile (Unified Carrom Pool Controls)

**Phase 1 - Striker Placement:**
- **Drag Horizontally**: Move striker left/right along baseline
- **Tap/Click Anywhere**: Confirm position and start aiming

**Phase 2 - Aiming & Shooting:**
- **Drag in Any Direction**: Rotate cue stick to aim
- **Drag Distance**: Further drag = more power (power bar shows live)
- **Release**: Take the shot

**Additional Controls:**
- **New Game Button**: Reset the game
- **Help Button**: View detailed instructions

## Technical Details

### Technologies Used
- HTML5 Canvas for rendering
- Vanilla JavaScript (no frameworks)
- CSS3 for styling
- Service Worker API for offline support
- Web App Manifest for installation

### Physics
- Realistic collision detection
- Friction and velocity damping
- Elastic collisions between pieces
- Board boundary detection

### AI
- Simple but effective computer opponent
- Targets own color pieces
- Aims towards nearest pocket
- Adjustable difficulty (power randomization)

## Browser Support

- ✅ Chrome (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ Safari (iOS)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet

## Troubleshooting

### PWA won't install
- Make sure you're using HTTPS or localhost
- Check that manifest.json is being served correctly
- Ensure service worker is registered (check browser console)
- Verify icons exist in the root directory

### Game not responsive on mobile
- Clear browser cache
- Check that viewport meta tag is present
- Ensure touch events are not being blocked

### Striker won't move
- Make sure all pieces have stopped moving
- Check that it's your turn (not computer's)
- Verify touch/click events are working

## Future Enhancements

Possible additions for future versions:
- Multiplayer support (local and online)
- Multiple difficulty levels for AI
- Sound effects and music
- Animation improvements
- Tournament mode
- Statistics tracking
- Different board themes
- Practice mode

## License

MIT License - Feel free to use and modify!

## Credits

Created with ❤️ for Carrom enthusiasts worldwide!

---

Enjoy playing Carrom Pool! 🎯
