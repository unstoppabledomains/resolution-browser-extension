import dotenv from 'dotenv';
import jestFetchMock from 'jest-fetch-mock';

// Adds the 'fetchMock' global variable and rewires 'fetch' global to call 'fetchMock'
// instead of the real implementation. Throws an exception if a call to fetch() is not
// encountered, which means an action was not mocked by the unit test.
jestFetchMock.enableMocks();
jestFetchMock.mockImplementation((url: any) => {
  throw new Error(
    `The test called fetch(${url}) unexpectedly. Ensure you mock all network requests through client actions.`,
  );
});

dotenv.config({
  path: __dirname + '/.env.test',
});
