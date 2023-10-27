export async function* asyncPool<IN, OUT>(
  poolLimit: number,
  array: Array<IN>,
  iteratorFn: (generator: IN, array?: Array<IN>) => Promise<OUT>
): AsyncIterableIterator<OUT> {
  const executing = new Set()
  async function consume() {
    const [promise, value] = (await Promise.race(executing)) as any
    executing.delete(promise)
    return value
  }
  for (const item of array) {
    // Wrap iteratorFn() in an async fn to ensure we get a promise.
    // Then expose such promise, so it's possible to later reference and
    // remove it from the executing pool.
    const promise: any = (async () => await iteratorFn(item, array))().then(
      (value) => [promise, value]
    )
    executing.add(promise)
    if (executing.size >= poolLimit) {
      yield await consume()
    }
  }
  while (executing.size) {
    yield await consume()
  }
}


// export async function asyncPool<IN, OUT>(
//   poolLimit: number,
//   array: Array<IN>,
//   iteratorFn: (generator: IN, array?: Array<IN>) => Promise<OUT>
// ): Promise<Array<OUT>> {
//   const results: Array<OUT> = []
//   const executing: Array<Promise<[Promise<any>, OUT]>> = []

//   async function consume() {
//     const [promise, value] = (await Promise.race(executing)) as [Promise<any>, OUT]
//     executing.splice(executing.findIndex(([p]) => p === promise), 1)
//     return value
//   }

//   for (const item of array) {
//     // Wrap iteratorFn() in an async function to ensure we get a promise.
//     // Then expose such promise, so it's possible to later reference and
//     // remove it from the executing pool.
//     const promise = (async () => await iteratorFn(item, array))().then(
//       (value) => [promise, value]
//     )
//     executing.push(promise)

//     if (executing.length >= poolLimit) {
//       results.push(await consume())
//     }
//   }

//   while (executing.length) {
//     results.push(await consume())
//   }

//   return results
// }
