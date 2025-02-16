import { expect } from 'chai';
import { ImproveDigitalAdServerJSClient, spec } from 'modules/improvedigitalBidAdapter.js';
import { config } from 'src/config.js';
import * as utils from 'src/utils.js';

describe('Improve Digital Adapter Tests', function () {
  const idClient = new ImproveDigitalAdServerJSClient('hb');

  const METHOD = 'GET';
  const URL = 'https://ice.360yield.com/hb';
  const PARAM_PREFIX = 'jsonp=';

  const simpleBidRequest = {
    bidder: 'improvedigital',
    params: {
      placementId: 1053688
    },
    adUnitCode: 'div-gpt-ad-1499748733608-0',
    transactionId: 'f183e871-fbed-45f0-a427-c8a63c4c01eb',
    bidId: '33e9500b21129f',
    bidderRequestId: '2772c1e566670b',
    auctionId: '192721e36a0239',
    mediaTypes: {
      banner: {
        sizes: [[300, 250], [160, 600], ['blah', 150], [-1, 300], [300, -5]]
      }
    },
    sizes: [[300, 250], [160, 600], ['blah', 150], [-1, 300], [300, -5]]
  };

  const videoParams = {
    skip: 1,
    skipmin: 5,
    skipafter: 30
  }

  const instreamBidRequest = utils.deepClone(simpleBidRequest);
  instreamBidRequest.mediaTypes = {
    video: {
      context: 'instream',
      playerSize: [640, 480]
    }
  };

  const outstreamBidRequest = utils.deepClone(simpleBidRequest);
  outstreamBidRequest.mediaTypes = {
    video: {
      context: 'outstream',
      playerSize: [640, 480]
    }
  };

  const multiFormatBidRequest = utils.deepClone(simpleBidRequest);
  multiFormatBidRequest.mediaTypes = {
    banner: {
      sizes: [[300, 250], [160, 600], ['blah', 150], [-1, 300], [300, -5]]
    },
    video: {
      context: 'outstream',
      playerSize: [640, 480]
    }
  };

  const simpleSmartTagBidRequest = {
    bidder: 'improvedigital',
    bidId: '1a2b3c',
    placementCode: 'placement1',
    params: {
      publisherId: 1032,
      placementKey: 'data_team_test_hb_smoke_test'
    }
  };

  const bidderRequest = {
    bids: [simpleBidRequest]
  };

  const instreamBidderRequest = {
    bids: [instreamBidRequest]
  };

  const outstreamBidderRequest = {
    bids: [outstreamBidRequest]
  };

  const multiFormatBidderRequest = {
    bids: [multiFormatBidRequest]
  };

  const bidderRequestGdpr = {
    bids: [simpleBidRequest],
    gdprConsent: {
      consentString: 'BOJ/P2HOJ/P2HABABMAAAAAZ+A==',
      vendorData: {},
      gdprApplies: true,
      addtlConsent: '1~1.35.41.101',
    },
  };

  const bidderRequestReferrer = {
    bids: [simpleBidRequest],
    refererInfo: {
      referer: 'https://blah.com/test.html',
    },
  };

  describe('isBidRequestValid', function () {
    it('should return false when no bid', function () {
      expect(spec.isBidRequestValid()).to.equal(false);
    });

    it('should return false when no bid.params', function () {
      const bid = {};
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });

    it('should return false when both placementId and placementKey + publisherId are missing', function () {
      const bid = { 'params': {} };
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });

    it('should return false when only one of placementKey and publisherId is present', function () {
      let bid = {
        params: {
          publisherId: 1234
        }
      };
      expect(spec.isBidRequestValid(bid)).to.equal(false);
      bid = {
        params: {
          placementKey: 'xyz'
        }
      };
      expect(spec.isBidRequestValid(bid)).to.equal(false);
    });

    it('should return true when placementId is passed', function () {
      expect(spec.isBidRequestValid(simpleBidRequest)).to.equal(true);
    });

    it('should return true when both placementKey and publisherId are passed', function () {
      expect(spec.isBidRequestValid(simpleSmartTagBidRequest)).to.equal(true);
    });
  });

  describe('buildRequests', function () {
    it('should make a well-formed request objects', function () {
      const requests = spec.buildRequests([simpleBidRequest], bidderRequest);
      expect(requests).to.be.an('array');
      expect(requests.length).to.equal(1);

      const request = requests[0];
      expect(request.method).to.equal(METHOD);
      expect(request.url).to.equal(URL);
      expect(request.bidderRequest).to.deep.equal(bidderRequest);
      expect(request.data.substring(0, PARAM_PREFIX.length)).to.equal(PARAM_PREFIX);

      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request).to.be.an('object');
      expect(params.bid_request.id).to.be.a('string');
      expect(params.bid_request.version).to.equal(`${spec.version}-${idClient.CONSTANTS.CLIENT_VERSION}`);
      expect(params.bid_request.gdpr).to.not.exist;
      expect(params.bid_request.us_privacy).to.not.exist;
      expect(params.bid_request.schain).to.not.exist;
      expect(params.bid_request.user).to.not.exist;
      expect(params.bid_request.imp).to.deep.equal([
        {
          id: '33e9500b21129f',
          pid: 1053688,
          tid: 'f183e871-fbed-45f0-a427-c8a63c4c01eb',
          banner: {}
        }
      ]);
    });

    it('should make a well-formed request object for multi-format ad unit', function () {
      const requests = spec.buildRequests([multiFormatBidRequest], multiFormatBidderRequest);
      expect(requests).to.be.an('array');
      expect(requests.length).to.equal(1);

      const request = requests[0];
      expect(request.method).to.equal(METHOD);
      expect(request.url).to.equal(URL);
      expect(request.bidderRequest).to.deep.equal(multiFormatBidderRequest);
      expect(request.data.substring(0, PARAM_PREFIX.length)).to.equal(PARAM_PREFIX);

      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request).to.be.an('object');
      expect(params.bid_request.id).to.be.a('string');
      expect(params.bid_request.version).to.equal(`${spec.version}-${idClient.CONSTANTS.CLIENT_VERSION}`);
      expect(params.bid_request.gdpr).to.not.exist;
      expect(params.bid_request.us_privacy).to.not.exist;
      expect(params.bid_request.imp).to.deep.equal([
        {
          id: '33e9500b21129f',
          pid: 1053688,
          tid: 'f183e871-fbed-45f0-a427-c8a63c4c01eb',
          banner: {}
        }
      ]);
    });

    it('should set placementKey and publisherId for smart tags', function () {
      const requests = spec.buildRequests([simpleSmartTagBidRequest], bidderRequest);
      const params = JSON.parse(decodeURIComponent(requests[0].data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].pubid).to.equal(1032);
      expect(params.bid_request.imp[0].pkey).to.equal('data_team_test_hb_smoke_test');
    });

    it('should add keyValues', function () {
      const bidRequest = Object.assign({}, simpleBidRequest);
      const keyValues = {
        testKey: [
          'testValue'
        ]
      };
      bidRequest.params.keyValues = keyValues;
      const request = spec.buildRequests([bidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].kvw).to.deep.equal(keyValues);
    });

    it('should add single size filter', function () {
      const bidRequest = Object.assign({}, simpleBidRequest);
      const size = {
        w: 800,
        h: 600
      };
      bidRequest.params.size = size;
      const request = spec.buildRequests([bidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].banner).to.deep.equal(size);
      // When single size filter is set, format shouldn't be populated. This
      // is to maintain backward compatibily
      expect(params.bid_request.imp[0].banner.format).to.not.exist;
    });

    it('should add currency', function () {
      const bidRequest = Object.assign({}, simpleBidRequest);
      const getConfigStub = sinon.stub(config, 'getConfig').returns('JPY');
      const request = spec.buildRequests([bidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].currency).to.equal('JPY');
      getConfigStub.restore();
    });

    it('should add bid floor', function () {
      const bidRequest = Object.assign({}, simpleBidRequest);
      let request = spec.buildRequests([bidRequest], bidderRequest)[0];
      let params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      // Floor price currency shouldn't be populated without a floor price
      expect(params.bid_request.imp[0].bidfloorcur).to.not.exist;

      // Default floor price currency
      bidRequest.params.bidFloor = 0.05;
      request = spec.buildRequests([bidRequest], bidderRequest)[0];
      params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].bidfloor).to.equal(0.05);
      expect(params.bid_request.imp[0].bidfloorcur).to.equal('USD');

      // Floor price currency
      bidRequest.params.bidFloorCur = 'eUR';
      request = spec.buildRequests([bidRequest])[0];
      params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].bidfloor).to.equal(0.05);
      expect(params.bid_request.imp[0].bidfloorcur).to.equal('EUR');

      // getFloor defined -> use it over bidFloor
      let getFloorResponse = { currency: 'USD', floor: 3 };
      bidRequest.getFloor = () => getFloorResponse;
      request = spec.buildRequests([bidRequest])[0];
      params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].bidfloor).to.equal(3);
      expect(params.bid_request.imp[0].bidfloorcur).to.equal('USD');
    });

    it('should add GDPR consent string', function () {
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestGdpr)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.gdpr).to.equal('BOJ/P2HOJ/P2HABABMAAAAAZ+A==');
      expect(params.bid_request.user.ext.consented_providers_settings.consented_providers).to.exist.and.to.deep.equal([1, 35, 41, 101]);
    });

    it('should add CCPA consent string', function () {
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], { uspConsent: '1YYY' })[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.us_privacy).to.equal('1YYY');
    });

    it('should add referrer', function () {
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.referrer).to.equal('https://blah.com/test.html');
    });

    it('should not add video params for banner', function () {
      const bidRequest = JSON.parse(JSON.stringify(simpleBidRequest));
      bidRequest.params.video = videoParams;
      const request = spec.buildRequests([bidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.not.exist;
    });

    it('should add ad type for instream video', function () {
      let bidRequest = JSON.parse(JSON.stringify(simpleBidRequest));
      bidRequest.mediaType = 'video';
      let request = spec.buildRequests([bidRequest], bidderRequest)[0];
      let params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].ad_types).to.deep.equal(['video']);
      expect(params.bid_request.imp[0].video).to.not.exist;

      bidRequest = JSON.parse(JSON.stringify(simpleBidRequest));
      bidRequest.mediaTypes = {
        video: {
          context: 'instream',
          playerSize: [640, 480]
        }
      };
      request = spec.buildRequests([bidRequest], bidderRequest)[0];
      params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].ad_types).to.deep.equal(['video']);
      expect(params.bid_request.imp[0].video).to.not.exist;
    });

    it('should not set ad type for outstream video', function() {
      const request = spec.buildRequests([outstreamBidRequest])[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].ad_types).to.not.exist;
      expect(params.bid_request.imp[0].video).to.not.exist;
    });

    it('should not set ad type for multi-format bids', function() {
      const request = spec.buildRequests([multiFormatBidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].ad_types).to.not.exist;
      expect(params.bid_request.imp[0].video).to.not.exist;
    });

    it('should set video params for instream', function() {
      const bidRequest = JSON.parse(JSON.stringify(instreamBidRequest));
      bidRequest.params.video = videoParams;
      const request = spec.buildRequests([bidRequest])[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.deep.equal(videoParams);
    });

    it('should set skip params only if skip=1', function() {
      const bidRequest = JSON.parse(JSON.stringify(instreamBidRequest));
      // 1
      const videoTest = {
        skip: 1,
        skipmin: 5,
        skipafter: 30
      }
      bidRequest.params.video = videoTest;
      let request = spec.buildRequests([bidRequest])[0];
      let params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.deep.equal(videoTest);

      // 0 - leave out skipmin and skipafter
      videoTest.skip = 0;
      bidRequest.params.video = videoTest;
      request = spec.buildRequests([bidRequest])[0];
      params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.deep.equal({ skip: 0 });

      // other
      videoTest.skip = 'blah';
      bidRequest.params.video = videoTest;
      request = spec.buildRequests([bidRequest])[0];
      params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.not.exist;
    });

    it('should ignore invalid/unexpected video params', function() {
      const bidRequest = JSON.parse(JSON.stringify(instreamBidRequest));
      // 1
      const videoTest = {
        skip: 1,
        skipmin: 5,
        skipafter: 30
      }
      const videoTestInvParam = Object.assign({}, videoTest);
      videoTestInvParam.blah = 1;
      bidRequest.params.video = videoTestInvParam;
      let request = spec.buildRequests([bidRequest])[0];
      let params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.deep.equal(videoTest);
    });

    it('should set video params for outstream', function() {
      const bidRequest = JSON.parse(JSON.stringify(outstreamBidRequest));
      bidRequest.params.video = videoParams;
      const request = spec.buildRequests([bidRequest])[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.deep.equal(videoParams);
    });

    it('should set video params for multi-format', function() {
      const bidRequest = JSON.parse(JSON.stringify(multiFormatBidRequest));
      bidRequest.params.video = videoParams;
      const request = spec.buildRequests([bidRequest])[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].video).to.deep.equal(videoParams);
    });

    it('should not set Prebid sizes in bid request for instream video', function () {
      const getConfigStub = sinon.stub(config, 'getConfig');
      getConfigStub.withArgs('improvedigital.usePrebidSizes').returns(true);
      const request = spec.buildRequests([instreamBidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].banner.format).to.not.exist;
      getConfigStub.restore();
    });

    it('should not set Prebid sizes in bid request for outstream video', function () {
      const getConfigStub = sinon.stub(config, 'getConfig');
      getConfigStub.withArgs('improvedigital.usePrebidSizes').returns(true);
      const request = spec.buildRequests([outstreamBidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].banner.format).to.not.exist;
      getConfigStub.restore();
    });

    it('should not set Prebid sizes in multi-format bid request', function () {
      const getConfigStub = sinon.stub(config, 'getConfig');
      getConfigStub.withArgs('improvedigital.usePrebidSizes').returns(true);
      const request = spec.buildRequests([multiFormatBidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].banner.format).to.not.exist;
      getConfigStub.restore();
    });

    it('should add schain', function () {
      const schain = '{"ver":"1.0","complete":1,"nodes":[{"asi":"headerlift.com","sid":"xyz","hp":1}]}';
      const bidRequest = Object.assign({}, simpleBidRequest);
      bidRequest.schain = schain;
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.schain).to.equal(schain);
    });

    it('should add eids', function () {
      const userId = { id5id:	{ uid: '1111' } };
      const expectedUserObject = { ext: { eids: [{
        source: 'id5-sync.com',
        uids: [{
          atype: 1,
          id: '1111'
        }]
      }]}};
      const bidRequest = Object.assign({}, simpleBidRequest);
      bidRequest.userId = userId;
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.user).to.deep.equal(expectedUserObject);
    });

    it('should return 2 requests', function () {
      const requests = spec.buildRequests([
        simpleBidRequest,
        simpleSmartTagBidRequest
      ], bidderRequest);
      expect(requests).to.be.an('array');
      expect(requests.length).to.equal(2);
      expect(requests[0].bidderRequest).to.deep.equal(bidderRequest);
      expect(requests[1].bidderRequest).to.deep.equal(bidderRequest);
    });

    it('should return one request in a single request mode', function () {
      const getConfigStub = sinon.stub(config, 'getConfig');
      getConfigStub.withArgs('improvedigital.singleRequest').returns(true);
      const requests = spec.buildRequests([
        simpleBidRequest,
        simpleSmartTagBidRequest
      ], bidderRequest);
      expect(requests).to.be.an('array');
      expect(requests.length).to.equal(1);
      getConfigStub.restore();
    });

    it('should set Prebid sizes in bid request', function () {
      const getConfigStub = sinon.stub(config, 'getConfig');
      getConfigStub.withArgs('improvedigital.usePrebidSizes').returns(true);
      const request = spec.buildRequests([simpleBidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].banner).to.deep.equal({
        format: [
          { w: 300, h: 250 },
          { w: 160, h: 600 }
        ]
      });
      getConfigStub.restore();
    });

    it('should not add single size filter when using Prebid sizes', function () {
      const getConfigStub = sinon.stub(config, 'getConfig');
      getConfigStub.withArgs('improvedigital.usePrebidSizes').returns(true);
      const bidRequest = Object.assign({}, simpleBidRequest);
      const size = {
        w: 800,
        h: 600
      };
      bidRequest.params.size = size;
      const request = spec.buildRequests([bidRequest], bidderRequest)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.imp[0].banner).to.deep.equal({
        format: [
          { w: 300, h: 250 },
          { w: 160, h: 600 }
        ]
      });
      getConfigStub.restore();
    });

    it('should set pagecat and genre ➞ fpd:ortb2.site', function() {
      config.setConfig(JSON.parse('{"ortb2":{"site":{"cat":["IAB2"],"pagecat":["IAB2-2"],"content":{"genre":"Adventure"}}}}'));
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.pagecat).to.be.an('array');
      expect(params.bid_request.pagecat).to.deep.equal(['IAB2-2']);
      expect(params.bid_request.genre).to.be.a('string');
      expect(params.bid_request.genre).be.equal('Adventure');
    });

    it('should not set pagecat and genre when malformed data provided ➞ fpd:ortb2.site', function() {
      config.setConfig(JSON.parse('{"ortb2":{"site":{"pagecat":"IAB2-2","content":{"genre":["Adventure"]}}}}'));
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.pagecat).does.not.exist;
      expect(params.bid_request.genre).does.not.exist;
    });

    it('should use cat when pagecat not available ➞ fpd:ortb2.site', function() {
      config.setConfig(JSON.parse('{"ortb2":{"site":{"cat":["IAB2"]}}}'));
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.pagecat).to.be.an('array');
      expect(params.bid_request.pagecat).to.deep.equal(['IAB2']);
    });

    it('should format pagecat correctly ➞ fpd:ortb2.site', function() {
      config.setConfig(JSON.parse('{"ortb2":{"site":{"cat":["IAB2", ["IAB-1"], "IAB3", 123, ""]}}}'));
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.pagecat).to.be.an('array');
      expect(params.bid_request.pagecat).to.deep.equal([
        'IAB2',
        'IAB3'
      ]
      );
    });

    it('should set coppa', function() {
      sinon.stub(config, 'getConfig')
        .withArgs('coppa')
        .returns(true);
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.coppa).to.equal(1);

      config.getConfig.restore();
    });

    it('should undefined coppa', function() {
      const bidRequest = Object.assign({}, simpleBidRequest);
      const request = spec.buildRequests([bidRequest], bidderRequestReferrer)[0];
      const params = JSON.parse(decodeURIComponent(request.data.substring(PARAM_PREFIX.length)));
      expect(params.bid_request.coppa).to.equal(undefined);
    });
  });

  const serverResponse = {
    'body': {
      'id': '687a06c541d8d1',
      'site_id': 191642,
      'bid': [
        {
          'isNet': false,
          'id': '33e9500b21129f',
          'advid': '5279',
          'price': 1.45888594164456,
          'nurl': 'https://ice.360yield.com/imp_pixel?ic=wVmhKI07hCVyGC1sNdFp.6buOSiGYOw8jPyZLlcMY2RCwD4ek3Fy6.xUI7U002skGBs3objMBoNU-Frpvmb9js3NKIG0YZJgWaNdcpXY9gOXE9hY4-wxybCjVSNzhOQB-zic73hzcnJnKeoGgcfvt8fMy18-yD0aVdYWt4zbqdoITOkKNCPBEgbPFu1rcje-o7a64yZ7H3dKvtnIixXQYc1Ep86xGSBGXY6xW2KfUOMT6vnkemxO72divMkMdhR8cAuqIubbx-ZID8-xf5c9k7p6DseeBW0I8ionrlTHx.rGosgxhiFaMqtr7HiA7PBzKvPdeEYN0hQ8RYo8JzYL82hA91A3V2m9Ij6y0DfIJnnrKN8YORffhxmJ6DzwEl1zjrVFbD01bqB3Vdww8w8PQJSkKQkd313tr-atU8LS26fnBmOngEkVHwAr2WCKxuUvxHmuVBTA-Lgz7wKwMoOJCA3hFxMavVb0ZFB7CK0BUTVU6z0De92Q.FJKNCHLMbjX3vcAQ90=',
          'h': 290,
          'pid': 1053688,
          'sync': [
            'https://link1',
            'https://link2'
          ],
          'crid': '422031',
          'w': 600,
          'cid': '99006',
          'adm': 'document.writeln(\"<a href=\\\"https:\\/\\/ice.360yield.com\\/click\\/wVmhKEKFeJufyP3hFfp7fv95ynoKe7vnG9V-j8EyAzklSoKRkownAclw4Zzcw-OcbJMg2KfjNiO8GoO9WP1jbNM8Q5GtmClbG9hZPBS4v6oBBiDi50AjRqHQsDAoBOJrIJtVyCfrnAIxvbysozCpLt20ov6jz2JPi6fe.D55HNeDLDyiLNgxVPa3y9jJZf65JBirCjOoZ-1Mj1BLB.57VdMaEhpGjjl5HnPgw0Pv7Hm1BO7PB9nCXJ9IwOH3IrKo.Wyy1iKDk6zeGwGOkQHSOMuQnCHyD35x6bhDQrpl5H6fTRTR8D2m5.-Zjh3fs8SKlo0i25EjKPw65iF.tvgcnq01U08OIh86EeSciamJgV0hNsk20TcTubfsoPN4are4nQ0y2gB-lz9tf3AjqHpSz5NoJWrpWtnrBHbjm.dS1XUQB1tzcLpIkA34nDe2eNxRZbZkZNSSs.Y8jQemfbjuLpttcemHqidFZo3xp37eSfUImw.HbyFdnK-wxFDYudgsIDxGJWI=\\/\\/https%3A%2F%2Fwww.improvedigital.com\\\" target=\\\"_blank\\\"><img style=\\\"border: 0;\\\" border=\\\"0\\\" width=\\\"600\\\" height=\\\"290\\\" src=\\\"https:\\/\\/creative.360yield.com\\/file\\/221728\\/ImproveDigital600x290.jpg\\\" alt=\\\"\\\"\\/><\\/a>\");document.writeln(\"<improvedigital_ad_output_information tp_id=\\\"\\\" buyer_id=\\\"0\\\" rtb_advertiser=\\\"\\\" campaign_id=\\\"99006\\\" line_item_id=\\\"268515\\\" creative_id=\\\"422031\\\" crid=\\\"0\\\" placement_id=\\\"1053688\\\"><\\/improvedigital_ad_output_information>\");'
        }
      ],
      'debug': ''
    }
  };

  const serverResponseRazr = {
    'body': {
      'id': '687a06c541d8d1',
      'site_id': 191642,
      'bid': [
        {
          'isNet': false,
          'id': '33e9500b21129f',
          'advid': '5279',
          'price': 1.45888594164456,
          'nurl': 'https://ice.360yield.com/imp_pixel?ic=wVmhKI07hCVyGC1sNdFp.6buOSiGYOw8jPyZLlcMY2RCwD4ek3Fy6.xUI7U002skGBs3objMBoNU-Frpvmb9js3NKIG0YZJgWaNdcpXY9gOXE9hY4-wxybCjVSNzhOQB-zic73hzcnJnKeoGgcfvt8fMy18-yD0aVdYWt4zbqdoITOkKNCPBEgbPFu1rcje-o7a64yZ7H3dKvtnIixXQYc1Ep86xGSBGXY6xW2KfUOMT6vnkemxO72divMkMdhR8cAuqIubbx-ZID8-xf5c9k7p6DseeBW0I8ionrlTHx.rGosgxhiFaMqtr7HiA7PBzKvPdeEYN0hQ8RYo8JzYL82hA91A3V2m9Ij6y0DfIJnnrKN8YORffhxmJ6DzwEl1zjrVFbD01bqB3Vdww8w8PQJSkKQkd313tr-atU8LS26fnBmOngEkVHwAr2WCKxuUvxHmuVBTA-Lgz7wKwMoOJCA3hFxMavVb0ZFB7CK0BUTVU6z0De92Q.FJKNCHLMbjX3vcAQ90=',
          'h': 290,
          'pid': 1053688,
          'sync': [
            'https://link1',
            'https://link2'
          ],
          'crid': '422031',
          'w': 600,
          'cid': '99006',
          'adm': 'document.writeln("<script async src=\"https:\/\/cdn.inskinad.com\/isfe\/tags\/dsp.js\"><\/script>\n<script type=\"text\/javascript\">\n      (function() {\n        var ns = window.inskin = window.inskin || {};\n        ns.dsp = ns.dsp || [];\n        ns.dsp.push({\n          uri: \"razr:\/\/provider\/format\"\n        });\n      })();\n<\/script>");document.writeln("<improvedigital_ad_output_information tp_id=\"\" buyer_id=\"0\" rtb_advertiser=\"\" campaign_id=\"123456\" line_item_id=\"123456\" creative_id=\"123456\" crid=\"0\" placement_id=\"123456\"><\/improvedigital_ad_output_information>");'
        }
      ],
      'debug': ''
    }
  };

  const serverResponseTwoBids = {
    'body': {
      'id': '687a06c541d8d1',
      'site_id': 191642,
      'bid': [
        serverResponse.body.bid[0],
        {
          'isNet': true,
          'id': '1234',
          'advid': '5280',
          'price': 1.23,
          'nurl': 'https://link/imp_pixel?ic=wVmhKI07hCVyGC1sNdFp.6buOSiGYOw8jPyZLlcMY2RCwD4ek3Fy6.xUI7U002skGBs3objMBoNU-Frpvmb9js3NKIG0YZJgWaNdcpXY9gOXE9hY4-wxybCjVSNzhOQB-zic73hzcnJnKeoGgcfvt8fMy18-yD0aVdYWt4zbqdoITOkKNCPBEgbPFu1rcje-o7a64yZ7H3dKvtnIixXQYc1Ep86xGSBGXY6xW2KfUOMT6vnkemxO72divMkMdhR8cAuqIubbx-ZID8-xf5c9k7p6DseeBW0I8ionrlTHx.rGosgxhiFaMqtr7HiA7PBzKvPdeEYN0hQ8RYo8JzYL82hA91A3V2m9Ij6y0DfIJnnrKN8YORffhxmJ6DzwEl1zjrVFbD01bqB3Vdww8w8PQJSkKQkd313tr-atU8LS26fnBmOngEkVHwAr2WCKxuUvxHmuVBTA-Lgz7wKwMoOJCA3hFxMavVb0ZFB7CK0BUTVU6z0De92Q.FJKNCHLMbjX3vcAQ90=',
          'h': 400,
          'pid': 1053688,
          'sync': [
            'https://link3'
          ],
          'crid': '422033',
          'w': 700,
          'cid': '99006',
          'adm': 'document.writeln(\"<a href=\\\"https:\\/\\/ice.360yield.com\\/click\\/wVmhKEKFeJufyP3hFfp7fv95ynoKe7vnG9V-j8EyAzklSoKRkownAclw4Zzcw-OcbJMg2KfjNiO8GoO9WP1jbNM8Q5GtmClbG9hZPBS4v6oBBiDi50AjRqHQsDAoBOJrIJtVyCfrnAIxvbysozCpLt20ov6jz2JPi6fe.D55HNeDLDyiLNgxVPa3y9jJZf65JBirCjOoZ-1Mj1BLB.57VdMaEhpGjjl5HnPgw0Pv7Hm1BO7PB9nCXJ9IwOH3IrKo.Wyy1iKDk6zeGwGOkQHSOMuQnCHyD35x6bhDQrpl5H6fTRTR8D2m5.-Zjh3fs8SKlo0i25EjKPw65iF.tvgcnq01U08OIh86EeSciamJgV0hNsk20TcTubfsoPN4are4nQ0y2gB-lz9tf3AjqHpSz5NoJWrpWtnrBHbjm.dS1XUQB1tzcLpIkA34nDe2eNxRZbZkZNSSs.Y8jQemfbjuLpttcemHqidFZo3xp37eSfUImw.HbyFdnK-wxFDYudgsIDxGJWI=\\/\\/https%3A%2F%2Fwww.improvedigital.com\\\" target=\\\"_blank\\\"><img style=\\\"border: 0;\\\" border=\\\"0\\\" width=\\\"600\\\" height=\\\"290\\\" src=\\\"https:\\/\\/creative.360yield.com\\/file\\/221728\\/ImproveDigital600x290.jpg\\\" alt=\\\"\\\"\\/><\\/a>\");document.writeln(\"<improvedigital_ad_output_information tp_id=\\\"\\\" buyer_id=\\\"0\\\" rtb_advertiser=\\\"\\\" campaign_id=\\\"99006\\\" line_item_id=\\\"268515\\\" creative_id=\\\"422031\\\" crid=\\\"0\\\" placement_id=\\\"1053688\\\"><\\/improvedigital_ad_output_information>\");'
        }
      ],
      'debug': ''
    }
  };

  const serverResponseNative = {
    body: {
      id: '687a06c541d8d1',
      site_id: 191642,
      bid: [
        {
          isNet: false,
          id: '33e9500b21129f',
          advid: '5279',
          price: 1.45888594164456,
          nurl: 'https://ice.360yield.com/imp_pixel?ic=wVm',
          h: 290,
          pid: 1053688,
          sync: [
            'https://link1',
            'https://link2'
          ],
          crid: '422031',
          w: 600,
          cid: '99006',
          native: {
            assets: [
              {
                title: {
                  text: 'Native title'
                }
              },
              {
                data: {
                  type: 1,
                  value: 'Improve Digital'
                }
              },
              {
                data: {
                  type: 2,
                  value: 'Native body'
                }
              },
              {
                data: {
                  type: 3,
                  value: '4' // rating
                }
              },
              {
                data: {
                  type: 4,
                  value: '10105' // likes
                }
              },
              {
                data: {
                  type: 5,
                  value: '150000' // downloads
                }
              },
              {
                data: {
                  type: 6,
                  value: '3.99' // price
                }
              },
              {
                data: {
                  type: 7,
                  value: '4.49' // salePrice
                }
              },
              {
                data: {
                  type: 8,
                  value: '(123) 456-7890' // phone
                }
              },
              {
                data: {
                  type: 9,
                  value: '123 Main Street, Anywhere USA' // address
                }
              },
              {
                data: {
                  type: 10,
                  value: 'body2'
                }
              },
              {
                data: {
                  type: 11,
                  value: 'https://myurl.com' // displayUrl
                }
              },
              {
                data: {
                  type: 12,
                  value: 'Do it' // cta
                }
              },
              {
                img: {
                  type: 1,
                  url: 'Should get ignored',
                  h: 300,
                  w: 400
                }
              },
              {
                img: {
                  type: 2,
                  url: 'https://blah.com/icon.jpg',
                  h: 30,
                  w: 40
                }

              },
              {
                img: {
                  type: 3,
                  url: 'https://blah.com/image.jpg',
                  h: 200,
                  w: 800
                }
              }
            ],
            link: {
              url: 'https://advertiser.com',
              clicktrackers: [
                'https://click.tracker.com/click?impid=123'
              ]
            },
            imptrackers: [
              'https://imptrack1.com',
              'https://imptrack2.com'
            ],
            jstracker: '<script src=\"https://www.foobar.js\"></script>',
            privacy: 'https://www.myprivacyurl.com'
          }
        }
      ],
      debug: ''
    }
  };

  const serverResponseVideo = {
    'body': {
      'id': '687a06c541d8d1',
      'site_id': 191642,
      'bid': [
        {
          'isNet': false,
          'id': '33e9500b21129f',
          'advid': '5279',
          'price': 1.45888594164456,
          'nurl': 'http://ice.360yield.com/imp_pixel?ic=wVmhKI07hCVyGC1sNdFp.6buOSiGYOw8jPyZLlcMY2RCwD4ek3Fy6.xUI7U002skGBs3objMBoNU-Frpvmb9js3NKIG0YZJgWaNdcpXY9gOXE9hY4-wxybCjVSNzhOQB-zic73hzcnJnKeoGgcfvt8fMy18-yD0aVdYWt4zbqdoITOkKNCPBEgbPFu1rcje-o7a64yZ7H3dKvtnIixXQYc1Ep86xGSBGXY6xW2KfUOMT6vnkemxO72divMkMdhR8cAuqIubbx-ZID8-xf5c9k7p6DseeBW0I8ionrlTHx.rGosgxhiFaMqtr7HiA7PBzKvPdeEYN0hQ8RYo8JzYL82hA91A3V2m9Ij6y0DfIJnnrKN8YORffhxmJ6DzwEl1zjrVFbD01bqB3Vdww8w8PQJSkKQkd313tr-atU8LS26fnBmOngEkVHwAr2WCKxuUvxHmuVBTA-Lgz7wKwMoOJCA3hFxMavVb0ZFB7CK0BUTVU6z0De92Q.FJKNCHLMbjX3vcAQ90=',
          'h': 290,
          'pid': 1053688,
          'sync': [
            'http://link1',
            'http://link2'
          ],
          'crid': '422031',
          'w': 600,
          'cid': '99006',
          'adm': '<VAST></VAST>',
          'ad_type': 'video'
        }
      ],
      'debug': ''
    }
  };

  const nativeEventtrackers = [
    {
      event: 1,
      method: 1,
      url: 'https://www.mytracker.com/imptracker'
    },
    {
      event: 1,
      method: 2,
      url: 'https://www.mytracker.com/tracker.js'
    }
  ];

  describe('interpretResponse', function () {
    const expectedBid = [
      {
        'ad': '<img src=\"https://ice.360yield.com/imp_pixel?ic=wVmhKI07hCVyGC1sNdFp.6buOSiGYOw8jPyZLlcMY2RCwD4ek3Fy6.xUI7U002skGBs3objMBoNU-Frpvmb9js3NKIG0YZJgWaNdcpXY9gOXE9hY4-wxybCjVSNzhOQB-zic73hzcnJnKeoGgcfvt8fMy18-yD0aVdYWt4zbqdoITOkKNCPBEgbPFu1rcje-o7a64yZ7H3dKvtnIixXQYc1Ep86xGSBGXY6xW2KfUOMT6vnkemxO72divMkMdhR8cAuqIubbx-ZID8-xf5c9k7p6DseeBW0I8ionrlTHx.rGosgxhiFaMqtr7HiA7PBzKvPdeEYN0hQ8RYo8JzYL82hA91A3V2m9Ij6y0DfIJnnrKN8YORffhxmJ6DzwEl1zjrVFbD01bqB3Vdww8w8PQJSkKQkd313tr-atU8LS26fnBmOngEkVHwAr2WCKxuUvxHmuVBTA-Lgz7wKwMoOJCA3hFxMavVb0ZFB7CK0BUTVU6z0De92Q.FJKNCHLMbjX3vcAQ90=\" width=\"0\" height=\"0\" style=\"display:none\"><script>document.writeln(\"<a href=\\\"https:\\/\\/ice.360yield.com\\/click\\/wVmhKEKFeJufyP3hFfp7fv95ynoKe7vnG9V-j8EyAzklSoKRkownAclw4Zzcw-OcbJMg2KfjNiO8GoO9WP1jbNM8Q5GtmClbG9hZPBS4v6oBBiDi50AjRqHQsDAoBOJrIJtVyCfrnAIxvbysozCpLt20ov6jz2JPi6fe.D55HNeDLDyiLNgxVPa3y9jJZf65JBirCjOoZ-1Mj1BLB.57VdMaEhpGjjl5HnPgw0Pv7Hm1BO7PB9nCXJ9IwOH3IrKo.Wyy1iKDk6zeGwGOkQHSOMuQnCHyD35x6bhDQrpl5H6fTRTR8D2m5.-Zjh3fs8SKlo0i25EjKPw65iF.tvgcnq01U08OIh86EeSciamJgV0hNsk20TcTubfsoPN4are4nQ0y2gB-lz9tf3AjqHpSz5NoJWrpWtnrBHbjm.dS1XUQB1tzcLpIkA34nDe2eNxRZbZkZNSSs.Y8jQemfbjuLpttcemHqidFZo3xp37eSfUImw.HbyFdnK-wxFDYudgsIDxGJWI=\\/\\/https%3A%2F%2Fwww.improvedigital.com\\\" target=\\\"_blank\\\"><img style=\\\"border: 0;\\\" border=\\\"0\\\" width=\\\"600\\\" height=\\\"290\\\" src=\\\"https:\\/\\/creative.360yield.com\\/file\\/221728\\/ImproveDigital600x290.jpg\\\" alt=\\\"\\\"\\/><\\/a>\");document.writeln(\"<improvedigital_ad_output_information tp_id=\\\"\\\" buyer_id=\\\"0\\\" rtb_advertiser=\\\"\\\" campaign_id=\\\"99006\\\" line_item_id=\\\"268515\\\" creative_id=\\\"422031\\\" crid=\\\"0\\\" placement_id=\\\"1053688\\\"><\\/improvedigital_ad_output_information>\");</script>',
        'creativeId': '422031',
        'cpm': 1.45888594164456,
        'currency': 'USD',
        'height': 290,
        'mediaType': 'banner',
        'netRevenue': false,
        'requestId': '33e9500b21129f',
        'ttl': 300,
        'width': 600
      }
    ];

    const expectedTwoBids = [
      expectedBid[0],
      {
        'ad': '<img src=\"https://link/imp_pixel?ic=wVmhKI07hCVyGC1sNdFp.6buOSiGYOw8jPyZLlcMY2RCwD4ek3Fy6.xUI7U002skGBs3objMBoNU-Frpvmb9js3NKIG0YZJgWaNdcpXY9gOXE9hY4-wxybCjVSNzhOQB-zic73hzcnJnKeoGgcfvt8fMy18-yD0aVdYWt4zbqdoITOkKNCPBEgbPFu1rcje-o7a64yZ7H3dKvtnIixXQYc1Ep86xGSBGXY6xW2KfUOMT6vnkemxO72divMkMdhR8cAuqIubbx-ZID8-xf5c9k7p6DseeBW0I8ionrlTHx.rGosgxhiFaMqtr7HiA7PBzKvPdeEYN0hQ8RYo8JzYL82hA91A3V2m9Ij6y0DfIJnnrKN8YORffhxmJ6DzwEl1zjrVFbD01bqB3Vdww8w8PQJSkKQkd313tr-atU8LS26fnBmOngEkVHwAr2WCKxuUvxHmuVBTA-Lgz7wKwMoOJCA3hFxMavVb0ZFB7CK0BUTVU6z0De92Q.FJKNCHLMbjX3vcAQ90=\" width=\"0\" height=\"0\" style=\"display:none\"><script>document.writeln(\"<a href=\\\"https:\\/\\/ice.360yield.com\\/click\\/wVmhKEKFeJufyP3hFfp7fv95ynoKe7vnG9V-j8EyAzklSoKRkownAclw4Zzcw-OcbJMg2KfjNiO8GoO9WP1jbNM8Q5GtmClbG9hZPBS4v6oBBiDi50AjRqHQsDAoBOJrIJtVyCfrnAIxvbysozCpLt20ov6jz2JPi6fe.D55HNeDLDyiLNgxVPa3y9jJZf65JBirCjOoZ-1Mj1BLB.57VdMaEhpGjjl5HnPgw0Pv7Hm1BO7PB9nCXJ9IwOH3IrKo.Wyy1iKDk6zeGwGOkQHSOMuQnCHyD35x6bhDQrpl5H6fTRTR8D2m5.-Zjh3fs8SKlo0i25EjKPw65iF.tvgcnq01U08OIh86EeSciamJgV0hNsk20TcTubfsoPN4are4nQ0y2gB-lz9tf3AjqHpSz5NoJWrpWtnrBHbjm.dS1XUQB1tzcLpIkA34nDe2eNxRZbZkZNSSs.Y8jQemfbjuLpttcemHqidFZo3xp37eSfUImw.HbyFdnK-wxFDYudgsIDxGJWI=\\/\\/https%3A%2F%2Fwww.improvedigital.com\\\" target=\\\"_blank\\\"><img style=\\\"border: 0;\\\" border=\\\"0\\\" width=\\\"600\\\" height=\\\"290\\\" src=\\\"https:\\/\\/creative.360yield.com\\/file\\/221728\\/ImproveDigital600x290.jpg\\\" alt=\\\"\\\"\\/><\\/a>\");document.writeln(\"<improvedigital_ad_output_information tp_id=\\\"\\\" buyer_id=\\\"0\\\" rtb_advertiser=\\\"\\\" campaign_id=\\\"99006\\\" line_item_id=\\\"268515\\\" creative_id=\\\"422031\\\" crid=\\\"0\\\" placement_id=\\\"1053688\\\"><\\/improvedigital_ad_output_information>\");</script>',
        'creativeId': '422033',
        'cpm': 1.23,
        'currency': 'USD',
        'height': 400,
        'mediaType': 'banner',
        'netRevenue': true,
        'requestId': '1234',
        'ttl': 300,
        'width': 700
      }
    ];

    const expectedBidNative = [
      {
        mediaType: 'native',
        creativeId: '422031',
        cpm: 1.45888594164456,
        currency: 'USD',
        height: 290,
        netRevenue: false,
        requestId: '33e9500b21129f',
        ttl: 300,
        width: 600,
        native: {
          title: 'Native title',
          body: 'Native body',
          body2: 'body2',
          cta: 'Do it',
          sponsoredBy: 'Improve Digital',
          rating: '4',
          likes: '10105',
          downloads: '150000',
          price: '3.99',
          salePrice: '4.49',
          phone: '(123) 456-7890',
          address: '123 Main Street, Anywhere USA',
          displayUrl: 'https://myurl.com',
          icon: {
            url: 'https://blah.com/icon.jpg',
            height: 30,
            width: 40
          },
          image: {
            url: 'https://blah.com/image.jpg',
            height: 200,
            width: 800
          },
          clickUrl: 'https://advertiser.com',
          clickTrackers: ['https://click.tracker.com/click?impid=123'],
          impressionTrackers: [
            'https://ice.360yield.com/imp_pixel?ic=wVm',
            'https://imptrack1.com',
            'https://imptrack2.com'
          ],
          javascriptTrackers: '<script src=\"https://www.foobar.js\"></script>',
          privacyLink: 'https://www.myprivacyurl.com'
        }
      }
    ];

    const expectedBidInstreamVideo = [
      {
        'vastXml': '<VAST></VAST>',
        'creativeId': '422031',
        'cpm': 1.45888594164456,
        'currency': 'USD',
        'height': 290,
        'mediaType': 'video',
        'netRevenue': false,
        'requestId': '33e9500b21129f',
        'ttl': 300,
        'width': 600
      }
    ];

    const expectedBidOutstreamVideo = utils.deepClone(expectedBidInstreamVideo);
    expectedBidOutstreamVideo[0].adResponse = {
      content: expectedBidOutstreamVideo[0].vastXml,
      height: expectedBidOutstreamVideo[0].height,
      width: expectedBidOutstreamVideo[0].width
    };

    it('should return a well-formed display bid', function () {
      const bids = spec.interpretResponse(serverResponse, {bidderRequest});
      expect(bids).to.deep.equal(expectedBid);
    });

    it('should return a well-formed display bid for multi-format ad unit', function () {
      const bids = spec.interpretResponse(serverResponse, {bidderRequest: multiFormatBidderRequest});
      expect(bids).to.deep.equal(expectedBid);
    });

    it('should return two bids', function () {
      const bids = spec.interpretResponse(serverResponseTwoBids, {bidderRequest});
      expect(bids).to.deep.equal(expectedTwoBids);
    });

    it('should set dealId correctly', function () {
      const response = JSON.parse(JSON.stringify(serverResponse));
      let bids;

      delete response.body.bid[0].lid;
      response.body.bid[0].buying_type = 'deal_id';
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.not.exist;

      response.body.bid[0].lid = 268515;
      delete response.body.bid[0].buying_type;
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.not.exist;

      response.body.bid[0].lid = 268515;
      response.body.bid[0].buying_type = 'rtb';
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.not.exist;

      response.body.bid[0].lid = 268515;
      response.body.bid[0].buying_type = 'classic';
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.equal(268515);

      response.body.bid[0].lid = 268515;
      response.body.bid[0].buying_type = 'deal_id';
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.equal(268515);

      response.body.bid[0].lid = [ 268515, 12456, 34567 ];
      response.body.bid[0].buying_type = 'deal_id';
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.not.exist;

      response.body.bid[0].lid = [ 268515, 12456, 34567 ];
      response.body.bid[0].buying_type = [ 'deal_id', 'classic' ];
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.not.exist;

      response.body.bid[0].lid = [ 268515, 12456, 34567 ];
      response.body.bid[0].buying_type = [ 'rtb', 'deal_id', 'deal_id' ];
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].dealId).to.equal(12456);
    });

    it('should set currency', function () {
      const response = JSON.parse(JSON.stringify(serverResponse));
      response.body.bid[0].currency = 'eur';
      const bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].currency).to.equal('EUR');
    });

    it('should return empty array for bad response or no price', function () {
      let response = JSON.parse(JSON.stringify(serverResponse));
      let bids;

      // Price missing or 0
      response.body.bid[0].price = 0;
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids).to.deep.equal([]);
      delete response.body.bid[0].price;
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids).to.deep.equal([]);
      response.body.bid[0].price = null;
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids).to.deep.equal([]);

      // errorCode present
      response = JSON.parse(JSON.stringify(serverResponse));
      response.body.bid[0].errorCode = undefined;
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids).to.deep.equal([]);

      // adm and native missing
      response = JSON.parse(JSON.stringify(serverResponse));
      delete response.body.bid[0].adm;
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids).to.deep.equal([]);
      response.body.bid[0].adm = null;
      bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids).to.deep.equal([]);
    });

    it('should set netRevenue', function () {
      const response = JSON.parse(JSON.stringify(serverResponse));
      response.body.bid[0].isNet = true;
      const bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].netRevenue).to.equal(true);
    });

    it('should set advertiserDomains', function () {
      const adomain = ['domain.com'];
      const response = JSON.parse(JSON.stringify(serverResponse));
      response.body.bid[0].adomain = adomain;
      const bids = spec.interpretResponse(response, {bidderRequest});
      expect(bids[0].meta.advertiserDomains).to.equal(adomain);
    });

    // Native ads
    it('should return a well-formed native ad bid', function () {
      let bids = spec.interpretResponse(serverResponseNative, {bidderRequest});
      expect(bids[0].ortbNative).to.deep.equal(serverResponseNative.body.bid[0].native);
      delete bids[0].ortbNative;
      expect(bids).to.deep.equal(expectedBidNative);

      // eventtrackers
      const response = JSON.parse(JSON.stringify(serverResponseNative));
      const expectedBids = JSON.parse(JSON.stringify(expectedBidNative));
      response.body.bid[0].native.eventtrackers = nativeEventtrackers;
      expectedBids[0].native.impressionTrackers = [
        'https://ice.360yield.com/imp_pixel?ic=wVm',
        'https://www.mytracker.com/imptracker'
      ];
      expectedBids[0].native.javascriptTrackers = '<script src=\"https://www.mytracker.com/tracker.js\"></script>';
      bids = spec.interpretResponse(response, {bidderRequest});
      delete bids[0].ortbNative;
      expect(bids).to.deep.equal(expectedBids);
    });

    // Video
    it('should return a well-formed instream video bid', function () {
      const bids = spec.interpretResponse(serverResponseVideo, {bidderRequest: instreamBidderRequest});
      expect(bids).to.deep.equal(expectedBidInstreamVideo);
    });

    it('should return a well-formed outstream video bid', function () {
      const bids = spec.interpretResponse(serverResponseVideo, {bidderRequest: outstreamBidderRequest});
      expect(bids[0].renderer).to.exist;
      delete (bids[0].renderer);
      expect(bids).to.deep.equal(expectedBidOutstreamVideo);
    });

    it('should return a well-formed outstream video bid for multi-format ad unit', function () {
      const bids = spec.interpretResponse(serverResponseVideo, {bidderRequest: multiFormatBidderRequest});
      expect(bids[0].renderer).to.exist;
      delete (bids[0].renderer);
      expect(bids).to.deep.equal(expectedBidOutstreamVideo);
    });

    it('should not affect non-RAZR bids', function () {
      const bids = spec.interpretResponse(serverResponse, {bidderRequest});
      expect(bids[0].renderer).to.not.exist;
    });

    it('should detect RAZR bids', function () {
      const bids = spec.interpretResponse(serverResponseRazr, {bidderRequest});
      expect(bids[0].renderer).to.exist;
    });
  });

  describe('getUserSyncs', function () {
    const serverResponses = [ serverResponseTwoBids ];

    it('should return no syncs when pixel syncing is disabled', function () {
      const syncs = spec.getUserSyncs({ pixelEnabled: false }, serverResponses);
      expect(syncs).to.deep.equal([]);
    });

    it('should return user syncs', function () {
      const syncs = spec.getUserSyncs({ pixelEnabled: true }, serverResponses);
      const expected = [
        { type: 'image', url: 'https://link1' },
        { type: 'image', url: 'https://link2' },
        { type: 'image', url: 'https://link3' }
      ];
      expect(syncs).to.deep.equal(expected);
    });
  });
});
