
# WebhookDebug Component Tests

This directory contains tests for the WebhookDebug component and its sub-components.

## Test Structure

Tests are organized by component, with each component having its own test file:

- `WebhookRawData.test.tsx`: Tests for the raw data display component
- `WebhookConfigAlert.test.tsx`: Tests for the configuration alert component
- `WebhookFormattedData.test.tsx`: Tests for the formatted data display component
- `WebhookDataSummary.test.tsx`: Tests for the data summary component
- `WebhookTroubleshootingGuide.test.tsx`: Tests for the troubleshooting guide component

## Mock Data

Mock data for testing is stored in `mockData.ts` and includes:

- `mockRawData`: Example of webhook data with various sections populated
- `mockEmptyData`: Example of webhook data with empty arrays
- `mockErrorData`: Example of an error response from the webhook

## Running Tests

To run these tests, you'll need to use the testing commands configured in your project. These tests assume the presence of:

- React Testing Library
- Jest

## Test Helpers

The `setup.ts` file contains helper functions and common setup for the tests.

## Test Coverage

These tests aim to verify:

1. Components render correctly with valid data
2. Components handle edge cases (null, undefined, empty data)
3. Interactive elements work as expected
4. Conditional rendering logic works correctly
