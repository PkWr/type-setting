# Project Rules and Guidelines

This document reinforces the coding standards and practices for the type-setting project.

## Code Organization

- **Modular Architecture**: Code should be modular with clear separation of concerns
- **No Inline Styles/Scripts**: All CSS and JavaScript must be in separate files
- **TypeScript First**: All functionality should be built using TypeScript
- **Reusability**: Reuse code functionality and styles wherever possible

## File Structure

```
type-setting/
├── src/           # TypeScript source files
├── styles/        # CSS stylesheets
├── dist/          # Compiled JavaScript output
├── index.html     # Main HTML file
├── package.json   # Dependencies and scripts
├── tsconfig.json  # TypeScript configuration
├── claude.md      # This file - project rules
└── changelog.md   # Change tracking log
```

## Development Workflow

1. **Code Changes**: Make changes in TypeScript source files (`src/`)
2. **Build**: Run `npm run build` to compile TypeScript to JavaScript
3. **Test**: Verify functionality works correctly
4. **Document**: Update changelog.md with changes
5. **Commit**: Commit changes with clear messages
6. **Push**: Push to GitHub repository after successful implementation

## Documentation Requirements

- **changelog.md**: Must maintain detailed logs with:
  - Timestamped actions
  - Agent IDs (when applicable)
  - Success/fail flags
  - Description of changes

## Quality Standards

- Code should be clean, readable, and well-commented
- Follow TypeScript best practices
- Ensure type safety throughout the codebase
- Test thoroughly before pushing to repository

## Communication

- Always confirm with the user that fixes are successful
- Avoid assumptions or concurrent task activity
- Build the project procedurally, step by step

