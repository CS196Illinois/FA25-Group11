# Frontend Tests

This directory contains automated tests for the React frontend.

## Running Tests

```bash
# Run all tests
cd Project/Frontend
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run in watch mode (default)
npm test
```

## Test Structure

- `setup.js` - Test configuration and cleanup
- `api.test.js` - API service function tests
- `App.test.jsx` - Basic component rendering tests

## Test Coverage

Current tests cover:
- API service functions (mocked)
- Basic component rendering
- Error handling patterns

## Notes

- Tests use Vitest (Vite-native testing framework)
- Tests use React Testing Library for component testing
- API calls are mocked to avoid network dependencies
- Tests run in jsdom environment for browser-like testing

