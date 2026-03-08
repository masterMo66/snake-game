# 🐍 Snake Game

A modern, responsive snake game built with HTML5 Canvas, CSS3, and JavaScript. Features a sleek dark theme, multiple difficulty levels, sound effects, and mobile touch controls.

![Snake Game Screenshot](https://img.shields.io/badge/status-live-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Version](https://img.shields.io/badge/version-1.0.0-orange)

## 🎮 Live Demo

Play the game at: [https://snake.moqi.chat](https://snake.moqi.chat)

## ✨ Features

- **Modern UI**: Dark theme with gradient backgrounds and smooth animations
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Multiple Difficulty Levels**: Normal, Fast, and Extreme modes
- **Touch Controls**: On-screen buttons for mobile play
- **Sound Effects**: Optional audio feedback for eating food and game over
- **High Score Tracking**: Local storage saves your best score
- **Customizable Settings**: Toggle grid visibility and sound effects
- **Keyboard Controls**: Support for both arrow keys and WASD

## 🚀 Quick Start

### Option 1: Play Online
Visit [https://snake.moqi.chat](https://snake.moqi.chat) to play directly in your browser.

### Option 2: Run Locally
```bash
# Clone the repository
git clone https://github.com/masterMo66/snake-game.git

# Navigate to the project directory
cd snake-game

# Open index.html in your browser
# You can use a simple HTTP server:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## 🎯 How to Play

1. **Objective**: Control the snake to eat the red food
2. **Controls**:
   - Desktop: Use arrow keys or WASD
   - Mobile: Use on-screen touch buttons
3. **Rules**:
   - Each food eaten increases your score by 10 points
   - The snake grows longer with each food
   - Avoid hitting walls or the snake's own body
   - Game ends on collision

## 📁 Project Structure

```
snake-game/
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── game.js             # Game logic and rendering
├── README.md           # This file
└── assets/             # (Optional) Image and sound assets
```

## 🛠️ Technologies Used

- **HTML5 Canvas**: For game rendering
- **CSS3**: Modern styling with flexbox and grid
- **JavaScript (ES6)**: Game logic and interactivity
- **Font Awesome**: Icons
- **Google Fonts**: Typography
- **Local Storage**: For saving high scores

## 🔧 Customization

### Change Game Speed
Modify the `gameSpeed` values in `game.js`:
```javascript
// Difficulty settings
Normal: 150ms
Fast: 100ms
Extreme: 70ms
```

### Change Colors
Edit the color variables in `style.css`:
```css
:root {
    --primary-color: #00adb5;
    --secondary-color: #4db6ac;
    --background-color: #1a1a2e;
    --accent-color: #ff6b6b;
}
```

### Add New Features
The game is built with a modular class structure. Key components:
- `SnakeGame` class: Main game controller
- `draw()` method: Handles canvas rendering
- `update()` method: Game state updates
- Event listeners: Keyboard and touch input

## 📱 Mobile Support

The game includes:
- Responsive design that adapts to screen size
- Touch-friendly controls with on-screen buttons
- Optimized performance for mobile devices
- Proper touch event handling

## 🎨 Design Features

1. **Visual Feedback**:
   - Snake head has eyes that follow direction
   - Food has a shiny apple-like appearance
   - Score animations on increase
   - Smooth transitions and hover effects

2. **Accessibility**:
   - High contrast colors
   - Keyboard navigation support
   - Screen reader friendly text

3. **Performance**:
   - Efficient canvas rendering
   - Minimal DOM manipulation
   - Optimized game loop

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions
- Add power-ups (speed boost, invincibility)
- Implement different snake skins
- Add multiplayer mode
- Create level progression
- Add background music
- Implement gamepad support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the classic Nokia Snake game
- Sound effects from [Mixkit](https://mixkit.co/)
- Icons from [Font Awesome](https://fontawesome.com/)
- Color palette from [Coolors](https://coolors.co/)

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/masterMo66/snake-game/issues) page
2. Create a new issue with details about the problem
3. Email: moqi@moqi.chat

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=masterMo66/snake-game&type=Date)](https://star-history.com/#masterMo66/snake-game&Date)

---

**Enjoy the game!** 🎮

If you like this project, please give it a ⭐ on GitHub!