import { Logger } from '@nestjs/common';

const LOGGER_METHODS = ['log', 'error', 'warn', 'debug', 'verbose'] as const;

beforeEach(() => {
  for (const method of LOGGER_METHODS) {
    jest.spyOn(Logger.prototype, method).mockImplementation(() => undefined);
  }
});
