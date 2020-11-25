const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeERC20Mintable (initialBalance, [minter, thirdParty]) {
  describe('mint', function () {
    const initialSupply = new BN(initialBalance);
    const amount = new BN(50);

    it('rejects a null account', async function () {
      await expectRevert(
        this.token.mint(ZERO_ADDRESS, amount, { from: minter }),
        'ERC20: mint to the zero address',
      );
    });

    describe('for a non null account', function () {
      beforeEach('minting', async function () {
        const { logs } = await this.token.mint(thirdParty, amount);
        this.logs = logs;
      });

      it('increments totalSupply', async function () {
        const expectedSupply = initialSupply.add(amount);
        (await this.token.totalSupply()).should.be.bignumber.equal(expectedSupply);
      });

      it('increments thirdParty balance', async function () {
        (await this.token.balanceOf(thirdParty)).should.be.bignumber.equal(amount);
      });

      it('emits Transfer event', async function () {
        const event = expectEvent.inLogs(this.logs, 'Transfer', {
          from: ZERO_ADDRESS,
          to: thirdParty,
        });

        event.args.value.should.be.bignumber.equal(amount);
      });
    });
  });
}

module.exports = {
  shouldBehaveLikeERC20Mintable,
};
