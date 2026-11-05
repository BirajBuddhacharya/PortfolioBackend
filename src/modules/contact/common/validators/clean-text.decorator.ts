import {
  ValidationArguments,
  ValidationOptions,
  buildMessage,
  registerDecorator,
} from 'class-validator';
import { validateEmail } from '../utils/validateEmail';

function makeCleanValidator(name: string) {
  return function (validationOptions?: ValidationOptions) {
    return function (object: NonNullable<unknown>, propertyName: string) {
      registerDecorator({
        name,
        target: object.constructor,
        propertyName,
        options: validationOptions,
        validator: {
          validate(value: any): boolean {
            return validateEmail(value);
          },
          defaultMessage: buildMessage(
            (eachPrefix: string) =>
              `${eachPrefix}$property contains disallowed words`,
            validationOptions,
          ),
        },
      });
    };
  };
}

/** Rejects text containing words from the illegal-words list. */
export const IsCleanText = makeCleanValidator('isCleanText');

/** Rejects emails containing words from the illegal-words list. */
export const IsCleanEmail = makeCleanValidator('isCleanEmail');
