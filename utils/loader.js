export async function showLoader() {
  const ora = (await import("ora")).default;
  const spinner = ora("Loading...").start();

  setTimeout(() => {
    spinner.stop();
    console.log("Done!");
  }, 2000);
}
