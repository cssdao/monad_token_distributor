// https://hardhat.org/ignition/docs/getting-started#overview

import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

export default buildModule('MonadTokenDistribute', (m) => {
  const apollo = m.contract('MonadTokenDistribute');

  return { apollo };
});
