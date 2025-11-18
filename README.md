# Typography Layout Calculator

A web-based calculator for typographic layouts based on Robert Bringhurst's principles from "The Elements of Typographic Style".

## Features

- Calculate optimal column widths for multi-column layouts
- Auto-suggest gutter width based on type size (1em)
- Calculate text box dimensions based on page margins
- Reference optimal column width for 66 characters per line (Bringhurst standard)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PkWr/type-setting.git
cd type-setting
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Open `index.html` in a web browser

### Development

To watch for changes and automatically rebuild:
```bash
npm run watch
```

## Deployment

### Netlify

This project is configured for deployment on Netlify. The `netlify.toml` file contains the build configuration:

- **Build command**: `npm install && npm run build`
- **Publish directory**: `.` (root)
- **Node version**: 18

To deploy:
1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the `netlify.toml` configuration
3. The site will build and deploy automatically on each push to the main branch

## Project Structure

```
type-setting/
├── src/           # TypeScript source files
│   ├── types.ts   # Type definitions
│   ├── calculator.ts  # Calculation logic
│   ├── ui.ts      # UI interaction handlers
│   └── main.ts    # Entry point
├── styles/        # CSS stylesheets
│   └── main.css   # Main stylesheet
├── dist/          # Compiled JavaScript (generated)
├── index.html     # Main HTML file
├── netlify.toml   # Netlify deployment configuration
├── _redirects     # Netlify redirects file
├── package.json   # Dependencies and scripts
└── tsconfig.json  # TypeScript configuration
```

## Usage

1. Enter page dimensions (width and height in mm)
2. Set margins (left, right, top, bottom in mm)
3. Specify type size (in points)
4. Choose number of columns
5. Click "Auto-set gutter width" to set gutter based on type size, or enter manually
6. Click "Calculate" to see results

## License

MIT

