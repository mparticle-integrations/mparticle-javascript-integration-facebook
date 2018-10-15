/* eslint-disable no-undef */
describe('Facebook Forwarder', function () {
    var MessageType = {
            SessionStart: 1,
            SessionEnd: 2,
            PageView: 3,
            PageEvent: 4,
            CrashReport: 5,
            OptOut: 6,
            Commerce: 16
        },
        EventType = {
            Unknown: 0,
            Navigation: 1,
            Location: 2,
            Search: 3,
            Transaction: 4,
            UserContent: 5,
            UserPreference: 6,
            Social: 7,
            Other: 8,
            Media: 9,
            getName: function () {
                return 'blahblah';
            }
        },
        ProductActionType = {
            Unknown: 0,
            AddToCart: 1,
            RemoveFromCart: 2,
            Checkout: 3,
            CheckoutOption: 4,
            Click: 5,
            ViewDetail: 6,
            Purchase: 7,
            Refund: 8,
            AddToWishlist: 9,
            RemoveFromWishlist: 10
        },
        CommerceEventType = {
            ProductAddToCart: 10,
            ProductRemoveFromCart: 11,
            ProductCheckout: 12,
            ProductCheckoutOption: 13,
            ProductClick: 14,
            ProductViewDetail: 15,
            ProductPurchase: 16,
            ProductRefund: 17,
            PromotionView: 18,
            PromotionClick: 19,
            ProductAddToWishlist: 20,
            ProductRemoveFromWishlist: 21,
            ProductImpression: 22
        };
    ReportingService = function () {
        var self = this;

        this.id = null;
        this.event = null;

        this.cb = function (id, event) {
            self.id = id;
            self.event = event;
        };

        this.reset = function () {
            this.id = null;
            this.event = null;
        };
    },
        reportService = new ReportingService();

    function MPMock() {
        var self = this;
        var calledMethods = ['track'];

        for (var i = 0; i < calledMethods.length; i++) {
            this[calledMethods[i] + 'Called'] = false;
        }

        function setCalledAttributes(attr) {
            self[attr] = true;
        }

        function fbq(fnName, eventname, params) {
            setCalledAttributes(fnName + 'Called');
            self.eventName = eventname;
            self.params = params;
        }

        return {
            fbq: fbq,
            fbqObj: this
        };
    }

    function checkBasicProperties(fnName) {
        window.fbqObj.should.have.property(fnName + 'Called', true);
        window.fbqObj.should.have.property('eventName');
        window.fbqObj.should.have.property('params');
    }

    before(function () {
        mParticle.EventType = EventType;
        mParticle.ProductActionType = ProductActionType;
        mParticle.CommerceEventType = CommerceEventType;
        mParticle.forwarder.init({
            pixelCode: '1228810793810857'
        }, reportService.cb, true);
    });


    beforeEach(function () {
        var mock = new MPMock();
        window.fbqObj = mock.fbqObj;
        window.fbq = mock.fbq;
    });

    describe('Events handled by this forwarder', function () {

        it('should log page event', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent
            });

            checkBasicProperties('trackCustom');
            done();
        });

        it('should log page view', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageView
            });
            checkBasicProperties('trackCustom');
            done();
        });

        it('should log commerce event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            done();
        });

        it('should not log event unsupported event', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.SessionStart
            });

            window.fbqObj.should.have.property('trackCalled', false);
            done();
        });

    });

    describe('Page Views', function () {
        it('should log page view', function (done) {
            mParticle.forwarder.process({
                EventName: 'testevent',
                EventDataType: MessageType.PageView
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'Viewed testevent');
            done();
        });
    });

    describe('Page Events', function () {
        it('should log page event', function (done) {
            mParticle.forwarder.process({
                EventName: 'testevent',
                EventDataType: MessageType.PageEvent
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.params.should.have.property('content_name', 'testevent');
            window.fbqObj.should.have.property('eventName', 'testevent');
            done();
        });

        it('should log page event with no event name', function (done) {
            mParticle.forwarder.process({
                EventDataType: MessageType.PageEvent
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.params.should.not.have.property('content_name');
            window.fbqObj.should.have.property('eventName', 'customEvent');
            done();
        });

        it('should log event attributes properly', function (done) {
            mParticle.forwarder.process({
                EventName: 'logevent',
                EventDataType: MessageType.PageEvent,
                EventAttributes: {foo: 'bar'}
            });

            window.fbqObj.params.should.have.property('foo', 'bar');
            done();
        });
    });

    describe('Commerce Events', function () {
        it('should log Purchase event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Purchase',
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.Purchase,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450, // Note this is used for the value param
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'Purchase');
            window.fbqObj.params.should.have.property('value', 450);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - Purchase');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.params.should.have.property('num_items', 1);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');

            done();
        });

        it('should log Checkout event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Checkout',
                EventCategory: CommerceEventType.ProductCheckout,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.Checkout,
                    CheckoutStep: 1,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 52,
                            CouponCode: null,
                            Quantity: 2
                        },
                        {
                            Sku: '22',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 800,
                            CouponCode: null,
                            Quantity: 3
                        },
                        {
                            Sku: '333',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 11,
                            CouponCode: null,
                            Quantity: 4
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450, // Note this is used for the value param
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'InitiateCheckout');
            window.fbqObj.params.should.have.property('value', 450);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_category', 'ProductCheckout');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - Checkout');
            window.fbqObj.params.should.have.property('content_ids', ['12345', '22', '333']);
            window.fbqObj.params.should.have.property('checkout_step', 1);
            window.fbqObj.params.should.have.property('num_items', 9);

            done();
        });

        it('should log AddToCart event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventCategory: CommerceEventType.ProductAddToCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToCart');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            done();
        });

        it('should log AddToCart event with correct total value', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToCart',
                EventCategory: CommerceEventType.ProductAddToCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.AddToCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 2
                        },
                        {
                            Sku: '888',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        },
                        {
                            Sku: '666',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TotalAmount: 0, // Note that total amount is not used.
                    TransactionId: 123,
                    Affiliation: 'my-affiliation'
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToCart');
            window.fbqObj.params.should.have.property('value', 1000);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345', '888', '666']);
            done();
        });

        it('should log RemoveFromCart event and use TotalAmount when present on ProductAction', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory: CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.RemoveFromCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1,
                            TotalAmount: 200
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TaxAmount: 40,
                    ShippingAmount: 10,
                    TotalAmount: 205
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'RemoveFromCart');
            window.fbqObj.params.should.have.property('value', 205);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - RemoveFromCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);

            done();
        });

        it('should log RemoveFromCart event and calculate TotalAmount if total amount is not present on ProductAction', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - RemoveFromCart',
                EventCategory: CommerceEventType.ProductRemoveFromCart,
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.RemoveFromCart,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1,
                            TotalAmount: 400
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('trackCustom');
            window.fbqObj.should.have.property('eventName', 'RemoveFromCart');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - RemoveFromCart');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);

            done();
        });

        it('should log AddToWishList event with correct total value', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToWishlist',
                EventCategory: CommerceEventType.ProductAddToWishlist,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 2 // <---- NOTE the multiplier here
                        },
                        {
                            Sku: '888',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        },
                        {
                            Sku: '666',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 100,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TotalAmount: 0, // Note that total amount is not used.
                    TransactionId: 123,
                    Affiliation: 'my-affiliation'
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('value', 1000);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToWishlist');
            window.fbqObj.params.should.have.property('content_ids', ['12345', '888', '666']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');

            done();
        });

        it('should log AddToWishlist event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - AddToWishlist',
                EventCategory: CommerceEventType.ProductAddToWishlist,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_category', 'ProductAddToWishlist');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - AddToWishlist');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');

            done();
        });

        it('should log ViewDetail event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - ViewDetail',
                EventCategory: CommerceEventType.ProductViewDetail,
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.ViewDetail,
                    ProductList: [
                        {
                            Sku: '145',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'ViewContent');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_name', 'eCommerce - ViewDetail');
            window.fbqObj.params.should.have.property('content_ids', ['145']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');

            done();
        });

        it('should default to ProductAction for content_category', function (done) {
            mParticle.forwarder.process({
                EventName: 'MyeCommerce',
                EventDataType: MessageType.Commerce,
                EventAttributes: {
                    eventAttr1: 'value1',
                    eventAttr2: 'value2'
                },
                ProductAction: {
                    ProductActionType: ProductActionType.AddToWishlist,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 400,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450,
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            checkBasicProperties('track');
            window.fbqObj.should.have.property('eventName', 'AddToWishlist');
            window.fbqObj.params.should.have.property('value', 400);
            window.fbqObj.params.should.have.property('currency', 'USD');
            window.fbqObj.params.should.have.property('content_category', 'AddToWishlist');
            window.fbqObj.params.should.have.property('content_name', 'MyeCommerce');
            window.fbqObj.params.should.have.property('content_ids', ['12345']);
            window.fbqObj.params.should.have.property('eventAttr1', 'value1');
            window.fbqObj.params.should.have.property('eventAttr2', 'value2');
            done();
        });

        it('should not log unsupported commerce event', function (done) {
            mParticle.forwarder.process({
                EventName: 'eCommerce - Refund,',
                EventDataType: MessageType.Commerce,
                ProductAction: {
                    ProductActionType: ProductActionType.Refund,
                    ProductList: [
                        {
                            Sku: '12345',
                            Name: 'iPhone 6',
                            Category: 'Phones',
                            Brand: 'iPhone',
                            Variant: '6',
                            Price: 200,
                            CouponCode: null,
                            Quantity: 1
                        }
                    ],
                    TransactionId: 123,
                    Affiliation: 'my-affiliation',
                    TotalAmount: 450, // Note this is used for the value param
                    TaxAmount: 40,
                    ShippingAmount: 10
                },
                CurrencyCode: 'USD'
            });

            window.fbqObj.should.have.property('trackCalled', false);
            done();
        });
    });
});
