import { Command } from "@cliffy/command";

export function command() {
  const cmd = new Command()
    .option("--task-name, -t <string>", "task name to filter on", {
      collect: true,
    })
    .option("--depends-on, -d <string>", "project path to depend on", {
      collect: true,
    })
    .option(
      "--depends-on-file <string>",
      "read `depends-on` paths from a file",
      { collect: true },
    )
    .option("--depends-on-stdin", "read `depends-on` paths from `stdin`");

  return cmd;
}
