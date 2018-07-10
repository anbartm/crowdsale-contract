let { GAS_PRICE } = require('../constants')

/**
 * Helper function for ignoring an error thrown by a reverted transaction.
 * Asserting reverts is useful when testing with ganache, but production
 * networks will not give reverts. Returns a promise.
 * @param   promise   The promise to ignore reverts on.
 *                    Usually a function call on a contract.
 */

let ignoreRevert = async promise => {
  let ret
  try {
    ret = await promise
    return ret
  } catch (error) {
    if (error.message.search('revert') === 0) {
      throw error
    }
  }
}

/**
 * Gets the transacion fee of a transaction based on its
 * transaction hash. Returns a promise.
 * @param txHash The hash of the transaction
 */
let txFee = txHash =>
  new Promise((resolve, reject) => {
    let { gasUsed } = web3.eth.getTransactionReceipt(txHash)
    web3.eth.getGasPrice((err, gasPrice) => {
      if (err) {
        reject(err)
      }
      resolve(gasPrice.mul(gasUsed))
    })
  })

/**
 * Converts a function whose last parameter is an (err,res)
 * callback into a normal promise
 */
let toPromise = func => (...args) =>
  new Promise((resolve, reject) =>
    func(...args, (error, data) => (error ? reject(error) : resolve(data)))
  )

/**
 * Utility function for sending ether. Returns a promise
 * that resolves into a transaction receipt. The transaction
 * receipt has an extra field `fee`, which is indicates
 * the transaction fee.
 * @param sender The sender contract instance or address
 * @param to Recipient contract instance or address
 * @param amount The amount in wei
 */
let sendEth = async (sender, to, amount) => {
  let fromAddress = sender.address || sender
  let toAddress = to.address || to
  let txHash = await toPromise(web3.eth.sendTransaction)({
    from: fromAddress,
    to: toAddress,
    value: amount,
    gas: 1000000,
    gasPrice: GAS_PRICE,
  })
  let receipt = await toPromise(web3.eth.getTransactionReceipt)(txHash)
  //await getRefunds(txHash)
  receipt.fee = await txFee(txHash)
  return receipt
}

/**
 * Getting the refunds from a transaction, WIP
 */
let getRefunds = async txHash => {
  let trace = await toPromise(web3.currentProvider.sendAsync)({
    method: 'debug_traceTransaction',
    params: [txHash],
    jsonrpc: '2.0',
    id: new Date().getTime(),
  })
  let transferTraces = trace.result.structLogs.filter(
    x => ['CALL', 'CALLCODE'].includes(x.op) && Number(x.stack.slice(-3, -2)[0]) !== 0
  )
  let refunds = {}
  for (let t of transferTraces) {
    //TODO: get the refunds from here
  }
}

module.exports = {
  ignoreRevert,
  txFee,
  toPromise,
  sendEth,
}
