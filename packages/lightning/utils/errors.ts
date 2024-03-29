import { create_message, message } from "./messages.ts";

/**
 * logs an error and returns a unique id and a message for users
 * @param e the error to log
 * @param extra any extra data to log
 * @param _id a function that returns a unique id (used for testing)
 */
export async function log_error(
  e: Error,
  extra: Record<string, unknown> = {},
  _id?: () => string,
): Promise<{
  e: Error;
  cause: unknown;
  extra: Record<string, unknown>;
  uuid: string;
  message: message<unknown>;
}> {
  const uuid = _id ? _id() : crypto.randomUUID();
  const error_hook = Deno.env.get("LIGHTNING_ERROR_HOOK") || "";

  if (error_hook !== "") {
    delete extra.msg;

    await (
      await fetch(error_hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: e.message,
              description: `\`\`\`js\n${e.stack}\n${
                JSON.stringify(
                  { ...extra, uuid },
                  r(),
                  2,
                )
              }\`\`\``,
            },
          ],
        }),
      })
    ).text();
  }

  console.error(`%cLightning Error ${uuid}`, "color: red");
  console.error(e, extra);

  return {
    e,
    cause: e.cause,
    uuid,
    extra,
    message: create_message(
      `Something went wrong! [Look here](https://williamhorning.dev/bolt) for help.\n\`\`\`\n${e.message}\n${uuid}\n\`\`\``,
    ),
  };
}

function r() {
  const seen = new WeakSet();
  return (_: string, value: unknown) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
}
