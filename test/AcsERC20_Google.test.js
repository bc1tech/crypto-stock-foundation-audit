const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

const { shouldBehaveLikeOwnable } = require('./access/behaviours/Ownable.behaviour');
const { shouldBehaveLikeAccessControl } = require('./access/behaviours/AccessControl.behaviour');
const { shouldBehaveLikeERC20 } = require('./token/ERC20/behaviours/ERC20.behaviour');
const { shouldBehaveLikeERC20Burnable } = require('./token/ERC20/behaviours/ERC20Burnable.behaviour');
const { shouldBehaveLikeERC20Mintable } = require('./token/ERC20/behaviours/ERC20Mintable.behaviour');
const { shouldBehaveLikeERC20PresetMinterPauser } = require('./token/ERC20/behaviours/ERC20PresetMinterPauser.behaviour'); // eslint-disable-line max-len

const AcsERC20 = artifacts.require('AcsERC20_Google');

contract('AcsERC20', function ([owner, other, thirdParty, authorized, otherAuthorized, otherAdmin]) {
  const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
  const PAUSER_ROLE = web3.utils.soliditySha3('PAUSER_ROLE');
  const BURNER_ROLE = web3.utils.soliditySha3('BURNER_ROLE');

  const _name = 'Alphabet Inc.';
  const _symbol = 'xGOOG';
  const _decimals = new BN(6);
  const _tokenSupply = new BN(333630000000);

  const _initialSupply = _tokenSupply.muln(Math.pow(10, _decimals));

  beforeEach(async function () {
    this.token = await AcsERC20.new({ from: owner });
  });

  context('like a ERC20', function () {
    shouldBehaveLikeERC20(_name, _symbol, _decimals, _initialSupply, [owner, other, thirdParty]);
  });

  context('like a ERC20Mintable', function () {
    shouldBehaveLikeERC20Mintable(_initialSupply, [owner, thirdParty]);
  });

  context('like a ERC20Burnable', function () {
    beforeEach(async function () {
      // get BURNER role to test behaviors
      this.token.grantRole(BURNER_ROLE, thirdParty, { from: owner });
    });

    shouldBehaveLikeERC20Burnable(_initialSupply, [owner, thirdParty]);
  });

  context('like a ERC20PresetMinterPauser', function () {
    shouldBehaveLikeERC20PresetMinterPauser([owner, thirdParty]);
  });

  context('like a Ownable', function () {
    beforeEach(async function () {
      this.ownable = this.token;
    });

    shouldBehaveLikeOwnable([owner, thirdParty]);
  });

  context('like a AccessControl', function () {
    beforeEach(async function () {
      this.accessControl = this.token;
    });

    shouldBehaveLikeAccessControl([owner, other, thirdParty, authorized, otherAuthorized, otherAdmin]);
  });

  context('like a AcsERC20', function () {
    describe('transfer ownership', function () {
      it('changes owner after transfer and grant/revoke roles', async function () {
        const receipt = await this.token.transferOwnership(authorized, { from: owner });

        expectEvent(receipt, 'OwnershipTransferred');
        expect(await this.token.owner()).to.equal(authorized);

        expectEvent(receipt, 'RoleGranted', { account: authorized, role: MINTER_ROLE, sender: owner });
        expectEvent(receipt, 'RoleGranted', { account: authorized, role: PAUSER_ROLE, sender: owner });
        expectEvent(receipt, 'RoleGranted', { account: authorized, role: BURNER_ROLE, sender: owner });
        expectEvent(receipt, 'RoleGranted', { account: authorized, role: DEFAULT_ADMIN_ROLE, sender: owner });

        expect(await this.token.hasRole(MINTER_ROLE, authorized)).to.equal(true);
        expect(await this.token.hasRole(PAUSER_ROLE, authorized)).to.equal(true);
        expect(await this.token.hasRole(BURNER_ROLE, authorized)).to.equal(true);
        expect(await this.token.hasRole(DEFAULT_ADMIN_ROLE, authorized)).to.equal(true);

        expectEvent(receipt, 'RoleRevoked', { account: owner, role: MINTER_ROLE, sender: owner });
        expectEvent(receipt, 'RoleRevoked', { account: owner, role: PAUSER_ROLE, sender: owner });
        expectEvent(receipt, 'RoleRevoked', { account: owner, role: BURNER_ROLE, sender: owner });
        expectEvent(receipt, 'RoleRevoked', { account: owner, role: DEFAULT_ADMIN_ROLE, sender: owner });

        expect(await this.token.hasRole(MINTER_ROLE, owner)).to.equal(false);
        expect(await this.token.hasRole(PAUSER_ROLE, owner)).to.equal(false);
        expect(await this.token.hasRole(BURNER_ROLE, owner)).to.equal(false);
        expect(await this.token.hasRole(DEFAULT_ADMIN_ROLE, owner)).to.equal(false);
      });
    });

    it('cannot renounce ownership', async function () {
      await expectRevert(
        this.token.renounceOwnership({ from: owner }),
        'AcsERC20: renounceOwnership function was disabled; please use transferOwnership',
      );
    });

    it('prevents non-owners from renouncement', async function () {
      await expectRevert(
        this.token.renounceOwnership({ from: thirdParty }),
        'AcsERC20: renounceOwnership function was disabled; please use transferOwnership',
      );
    });

    describe('burn', function () {
      describe('when caller has not the BURNER role', function () {
        beforeEach(async function () {
          this.token.renounceRole(BURNER_ROLE, owner, { from: owner });
        });

        it('reverts', async function () {
          await expectRevert(this.token.burn(_initialSupply, { from: owner }),
            'AcsERC20: must have burner role to burn',
          );
        });
      });
    });

    describe('burnFrom', function () {
      describe('when caller has not the BURNER role', function () {
        beforeEach(async function () {
          await this.token.approve(thirdParty, _initialSupply, { from: owner });
        });

        it('reverts', async function () {
          await expectRevert(this.token.burnFrom(owner, _initialSupply, { from: thirdParty }),
            'AcsERC20: must have burner role to burn',
          );
        });
      });
    });
  });
});
