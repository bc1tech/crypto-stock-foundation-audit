const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeOwnable ([owner, thirdParty]) {
  it('has an owner', async function () {
    expect(await this.ownable.owner()).to.equal(owner);
  });

  describe('transfer ownership', function () {
    it('changes owner after transfer', async function () {
      const receipt = await this.ownable.transferOwnership(thirdParty, { from: owner });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(thirdParty);
    });

    it('prevents non-owners from transferring', async function () {
      await expectRevert(
        this.ownable.transferOwnership(thirdParty, { from: thirdParty }),
        'Ownable: caller is not the owner',
      );
    });

    it('guards ownership against stuck state', async function () {
      await expectRevert(
        this.ownable.transferOwnership(ZERO_ADDRESS, { from: owner }),
        'Ownable: new owner is the zero address',
      );
    });
  });
}

module.exports = {
  shouldBehaveLikeOwnable,
};
