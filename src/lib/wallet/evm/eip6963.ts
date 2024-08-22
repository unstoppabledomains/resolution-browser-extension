import {
  EIP6963EventNames,
  EIP6963ProviderDetail,
  EIP6963RequestProviderEvent,
} from "../../../types/eip6963";

export function announceProvider(providerDetail: EIP6963ProviderDetail): void {
  const {info, provider} = providerDetail;

  const _announceProvider = () =>
    window.dispatchEvent(
      new CustomEvent(EIP6963EventNames.Announce, {
        detail: Object.freeze({info: {...info}, provider}),
      }),
    );

  _announceProvider();
  window.addEventListener(
    EIP6963EventNames.Request,
    (event: EIP6963RequestProviderEvent) => {
      _announceProvider();
    },
  );
}
