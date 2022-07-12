import { providers } from 'ethers'
import { isAddress } from 'ethers/lib/utils'

import { fetchEnsAddress } from '../ens'
import { getProvider } from '../providers'

export type PrepareSendTransactionArgs = {
  /** Chain ID used to validate if the signer is connected to the target chain */
  chainId?: number
  /** Request data to prepare the transaction */
  request: providers.TransactionRequest & {
    to: NonNullable<providers.TransactionRequest['to']>
  }
  signerOrProvider?: providers.JsonRpcSigner | providers.Provider
}

export type PrepareSendTransactionResult = {
  chainId?: number
  request: providers.TransactionRequest & {
    to: NonNullable<providers.TransactionRequest['to']>
    gasLimit: NonNullable<providers.TransactionRequest['gasLimit']>
  }
  mode: 'prepared'
}

/**
 * @description Prepares the parameters required for sending a transaction.
 *
 * Returns config to be passed through to {@link sendTransaction}.
 *
 * @example
 * import { prepareSendTransaction, sendTransaction } from '@wagmi/core'
 *
 * const config = await prepareSendTransaction({
 *  to: 'moxey.eth',
 *  value: parseEther('1'),
 * })
 * const result = await sendTransaction(config)
 */
export async function prepareSendTransaction({
  chainId,
  request,
  signerOrProvider = getProvider(),
}: PrepareSendTransactionArgs): Promise<PrepareSendTransactionResult> {
  const [to, gasLimit] = await Promise.all([
    isAddress(request.to)
      ? Promise.resolve(request.to)
      : fetchEnsAddress({ name: request.to }),
    request.gasLimit
      ? Promise.resolve(request.gasLimit)
      : signerOrProvider.estimateGas(request),
  ])

  return {
    ...(chainId ? { chainId } : {}),
    request: { ...request, gasLimit, to: to as string },
    mode: 'prepared',
  }
}