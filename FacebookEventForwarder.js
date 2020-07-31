var mpFacebookKit = (function (exports) {
  /*!
   * isobject <https://github.com/jonschlinkert/isobject>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  function isObject(val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false;
  }

  /* eslint-disable no-undef */
  //  Copyright 2015 mParticle, Inc.
  //
  //  Licensed under the Apache License, Version 2.0 (the "License");
  //  you may not use this file except in compliance with the License.
  //  You may obtain a copy of the License at
  //
  //      http://www.apache.org/licenses/LICENSE-2.0
  //
  //  Unless required by applicable law or agreed to in writing, software
  //  distributed under the License is distributed on an "AS IS" BASIS,
  //  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  //  See the License for the specific language governing permissions and
  //  limitations under the License.
      

      var name = 'Facebook',
          moduleId = 45,
          MessageType = {
              SessionStart: 1,
              SessionEnd: 2,
              PageView: 3,
              PageEvent: 4,
              CrashReport: 5,
              OptOut: 6,
              Commerce: 16
          },
          SupportedCommerceTypes = [],
          constructor = function () {
              var self = this,
                  isInitialized = false,
                  reportingService = null;

              self.name = name;

              function initForwarder(settings, service, testMode) {
                  reportingService = service;

                  SupportedCommerceTypes = [
                      mParticle.ProductActionType.Checkout,
                      mParticle.ProductActionType.Purchase,
                      mParticle.ProductActionType.AddToCart,
                      mParticle.ProductActionType.RemoveFromCart,
                      mParticle.ProductActionType.AddToWishlist,
                      mParticle.ProductActionType.ViewDetail
                  ];

                  try {
                      if (!testMode) {
                          !function (f, b, e, v, n, t, s) {
                              if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n;
                              n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0];
                              s.parentNode.insertBefore(t, s);
                          } (window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

                          fbq('init', settings.pixelId);
                      }

                      isInitialized = true;

                      return 'Successfully initialized: ' + name;

                  }
                  catch (e) {
                      return 'Can\'t initialize forwarder: ' + name + ':' + e;
                  }
              }

              function processEvent(event) {
                  var reportEvent = false;

                  if (!isInitialized) {
                      return 'Can\'t send forwarder ' + name + ', not initialized';
                  }

                  try {
                      if (event.EventDataType == MessageType.PageView) {
                          reportEvent = true;
                          logPageView(event);
                      }
                      else if (event.EventDataType == MessageType.PageEvent) {
                          reportEvent = true;
                          logPageEvent(event);
                      }
                      else if (event.EventDataType == MessageType.Commerce) {
                          reportEvent = logCommerceEvent(event);
                      }

                      if (reportEvent && reportingService) {
                          reportingService(self, event);
                      }

                      return 'Successfully sent to forwarder ' + name;
                  }
                  catch (error) {
                      return 'Can\'t send to forwarder: ' + name + ' ' + error;
                  }
              }

              function logCommerceEvent(event) {
                  if (event.ProductAction &&
                      event.ProductAction.ProductList &&
                      event.ProductAction.ProductActionType &&
                      SupportedCommerceTypes.indexOf(event.ProductAction.ProductActionType) > -1) {

                      var eventName,
                          totalValue,
                          params = cloneEventAttributes(event);

                      if (event.CurrencyCode) {
                          params['currency'] = event.CurrencyCode;
                      }
                      else{
                          params['currency'] = 'USD'; // Inject CurrencyCode if it doesn't exist
                      }

                      if (event.EventName) {
                          params['content_name'] = event.EventName;
                      }

                      var productSkus = event.ProductAction.ProductList.reduce(function (arr, curr) {
                          if (curr.Sku) {
                              arr.push(curr.Sku);
                          }
                          return arr;
                      }, []);

                      if (productSkus && productSkus.length > 0) {
                          params['content_ids'] = productSkus;
                      }

                      if (event.ProductAction.ProductActionType == mParticle.ProductActionType.AddToWishlist ||
                          event.ProductAction.ProductActionType == mParticle.ProductActionType.Checkout) {
                          var eventCategory = getEventCategoryString(event);
                          if (eventCategory) {
                              params['content_category'] = eventCategory;
                          }
                          if (event.ProductAction.ProductActionType == mParticle.ProductActionType.Checkout && event.ProductAction.CheckoutStep) {
                              params['checkout_step'] = event.ProductAction.CheckoutStep;
                          }
                      }

                      if (event.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart ||
                          event.ProductAction.ProductActionType == mParticle.ProductActionType.AddToWishlist ||
                          event.ProductAction.ProductActionType == mParticle.ProductActionType.ViewDetail) {

                          totalValue = event.ProductAction.ProductList.reduce(function(sum, product){
                              if (isNumeric(product.Price) && isNumeric(product.Quantity)) {
                                  sum += product.Price * product.Quantity;
                              }
                              return sum;
                          }, 0);

                          params['value'] = totalValue;

                          if (event.ProductAction.ProductActionType == mParticle.ProductActionType.AddToWishlist){
                              eventName = 'AddToWishlist';
                          }
                          else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.AddToCart){
                              eventName = 'AddToCart';
                          }
                          else{
                              eventName = 'ViewContent';
                          }

                      }
                      else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.Checkout ||
                               event.ProductAction.ProductActionType == mParticle.ProductActionType.Purchase) {

                          eventName = event.ProductAction.ProductActionType == mParticle.ProductActionType.Checkout ? 'InitiateCheckout' : 'Purchase';

                          if (event.ProductAction.TotalAmount) {
                              params['value'] = event.ProductAction.TotalAmount;
                          }

                          var num_items = event.ProductAction.ProductList.reduce(function(sum, product){
                              if (isNumeric(product.Quantity)) {
                                  sum += product.Quantity;
                              }
                              return sum;
                          }, 0);
                          params['num_items'] = num_items;
                      }
                      else if (event.ProductAction.ProductActionType == mParticle.ProductActionType.RemoveFromCart) {
                          eventName = 'RemoveFromCart';

                          // remove from cart can be performed in 1 of 2 ways:
                          // 1. mParticle.eCommerce.logProductEvent(), which contains event.ProductAction.TotalAmount
                          // 2. mParticle.eCommerce.Cart.remove(), which does not contain event.ProductAction.TotalAmount
                          // when there is no TotalAmount, a manual calculation must be done
                          if (event.ProductAction.TotalAmount) {
                              totalValue = event.ProductAction.TotalAmount;
                          } else {
                              totalValue = event.ProductAction.ProductList.reduce(function(sum, product) {
                                  if (isNumeric(product.TotalAmount)) {
                                      sum += product.TotalAmount;
                                  }
                                  return sum;
                              }, 0);
                          }

                          params['value'] = totalValue;

                          fbq('trackCustom', eventName || 'customEvent', params);
                          return true;
                      }

                      if (eventName) {
                          fbq('track', eventName, params);
                      }
                      else {
                          return false;
                      }

                      return true;
                  }

                  return false;
              }

              function logPageView(event) {
                  logPageEvent(event, 'Viewed ' + event.EventName);
              }

              function logPageEvent(event, eventName) {
                  var params = cloneEventAttributes(event);
                  eventName = eventName || event.EventName;
                  if (event.EventName) {
                      params['content_name'] = event.EventName;
                  }
                  fbq('trackCustom', eventName || 'customEvent', params);
              }

              function cloneEventAttributes(event) {
                  var attr = {};
                  if (event && event.EventAttributes) {
                      try {
                          attr = JSON.parse(JSON.stringify(event.EventAttributes));
                      }
                      catch (e) {
                          //
                      }
                  }
                  return attr;
              }

              function isNumeric(n) {
                  return !isNaN(parseFloat(n)) && isFinite(n);
              }

              function getEventCategoryString(event) {

                  var enumTypeValues;
                  var enumValue;
                  if (event.EventDataType == MessageType.Commerce) {
                      enumTypeValues = event.EventCategory ? mParticle.CommerceEventType : mParticle.ProductActionType;
                      enumValue = event.EventCategory || event.ProductAction.ProductActionType;
                  }
                  else {
                      enumTypeValues = mParticle.EventType;
                      enumValue = event.EventCategory;
                  }

                  if (enumTypeValues && enumValue) {

                      for (var category in enumTypeValues) {
                          if (enumValue == enumTypeValues[category]) {
                              return category;
                          }
                      }
                  }

                  return null;
              }

              this.init = initForwarder;
              this.process = processEvent;
          };

      function getId() {
          return moduleId;
      }

      function register(config) {
          if (!config) {
              window.console.log('You must pass a config object to register the kit ' + name);
              return;
          }

          if (!isObject(config)) {
              window.console.log('\'config\' must be an object. You passed in a ' + typeof config);
              return;
          }

          if (isObject(config.kits)) {
              config.kits[name] = {
                  constructor: constructor
              };
          } else {
              config.kits = {};
              config.kits[name] = {
                  constructor: constructor
              };
          }
          window.console.log('Successfully registered ' + name + ' to your mParticle configuration');
      }

      if (window && window.mParticle && window.mParticle.addForwarder) {
          window.mParticle.addForwarder({
              name: name,
              constructor: constructor,
              getId: getId
          });
      }

      var FacebookEventForwarder = {
          register: register
      };
  var FacebookEventForwarder_1 = FacebookEventForwarder.register;

  exports.default = FacebookEventForwarder;
  exports.register = FacebookEventForwarder_1;

  return exports;

}({}));
