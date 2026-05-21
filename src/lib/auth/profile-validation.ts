export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 24;
export const BIO_MAX_LENGTH = 160;
export const AVATAR_MAX_INPUT_BYTES = 8 * 1024 * 1024;

const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export type ProfileFieldErrors = {
  username?: string;
  bio?: string;
  avatar?: string;
};

export function normalizeUsername(raw: string): string {
  return raw.trim();
}

export function validateProfileFields(
  username: string,
  bio: string,
  t: (key: string, values?: Record<string, string | number>) => string
): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};
  const name = normalizeUsername(username);

  if (!name) {
    errors.username = t("usernameRequired");
  } else if (name.length < USERNAME_MIN_LENGTH) {
    errors.username = t("usernameTooShort", { min: USERNAME_MIN_LENGTH });
  } else if (name.length > USERNAME_MAX_LENGTH) {
    errors.username = t("usernameTooLong", { max: USERNAME_MAX_LENGTH });
  } else if (!USERNAME_PATTERN.test(name)) {
    errors.username = t("usernameInvalid");
  }

  if (bio.length > BIO_MAX_LENGTH) {
    errors.bio = t("bioTooLong", { max: BIO_MAX_LENGTH });
  }

  return errors;
}

export function validateAvatarFile(
  file: File,
  t: (key: string) => string
): string | undefined {
  if (!file.type.startsWith("image/")) {
    return t("avatarType");
  }
  if (file.size > AVATAR_MAX_INPUT_BYTES) {
    return t("avatarTooLarge");
  }
  return undefined;
}
