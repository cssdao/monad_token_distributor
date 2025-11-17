"use strict";
// https://hardhat.org/ignition/docs/getting-started#overview
Object.defineProperty(exports, "__esModule", { value: true });
const modules_1 = require("@nomicfoundation/hardhat-ignition/modules");
exports.default = (0, modules_1.buildModule)('MonadTokenDistribute', (m) => {
    const apollo = m.contract('MonadTokenDistribute');
    return { apollo };
});
