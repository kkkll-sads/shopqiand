var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "node_modules/react/cjs/react.development.js"(exports, module) {
    "use strict";
    (function() {
      function defineDeprecationWarning(methodName, info) {
        Object.defineProperty(Component2.prototype, methodName, {
          get: function() {
            console.warn(
              "%s(...) is deprecated in plain JavaScript React classes. %s",
              info[0],
              info[1]
            );
          }
        });
      }
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable)
          return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      function warnNoop(publicInstance, callerName) {
        publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
        var warningKey = publicInstance + "." + callerName;
        didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
          "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
          callerName,
          publicInstance
        ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
      }
      function Component2(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function ComponentDummy() {
      }
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        newKey = ReactElement(
          oldElement.type,
          newKey,
          oldElement.props,
          oldElement._owner,
          oldElement._debugStack,
          oldElement._debugTask
        );
        oldElement._store && (newKey._store.validated = oldElement._store.validated);
        return newKey;
      }
      function validateChildKeys(node) {
        isValidElement2(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement2(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement2(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback) {
          invokeCallback = children;
          callback = callback(invokeCallback);
          var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
          isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
            return c;
          })) : null != callback && (isValidElement2(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + childKey
          ), "" !== nameSoFar && null != invokeCallback && isValidElement2(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
          return 1;
        }
        invokeCallback = 0;
        childKey = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i = 0; i < children.length; i++)
            nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i = getIteratorFn(children), "function" === typeof i)
          for (i === children.entries && (didWarnAboutMaps || console.warn(
            "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
          ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ioInfo = payload._ioInfo;
          null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
          ioInfo = payload._result;
          var thenable = ioInfo();
          thenable.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 1;
                payload._result = moduleObject;
                var _ioInfo = payload._ioInfo;
                null != _ioInfo && (_ioInfo.end = performance.now());
                void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
              }
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status) {
                payload._status = 2;
                payload._result = error;
                var _ioInfo2 = payload._ioInfo;
                null != _ioInfo2 && (_ioInfo2.end = performance.now());
                void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            }
          );
          ioInfo = payload._ioInfo;
          if (null != ioInfo) {
            ioInfo.value = thenable;
            var displayName = thenable.displayName;
            "string" === typeof displayName && (ioInfo.name = displayName);
          }
          -1 === payload._status && (payload._status = 0, payload._result = thenable);
        }
        if (1 === payload._status)
          return ioInfo = payload._result, void 0 === ioInfo && console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
            ioInfo
          ), "default" in ioInfo || console.error(
            "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
            ioInfo
          ), ioInfo.default;
        throw payload._result;
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      function releaseAsyncTransition() {
        ReactSharedInternals.asyncTransitions--;
      }
      function enqueueTask(task) {
        if (null === enqueueTaskImpl)
          try {
            var requireString = ("require" + Math.random()).slice(0, 7);
            enqueueTaskImpl = (module && module[requireString]).call(
              module,
              "timers"
            ).setImmediate;
          } catch (_err) {
            enqueueTaskImpl = function(callback) {
              false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
              ));
              var channel = new MessageChannel();
              channel.port1.onmessage = callback;
              channel.port2.postMessage(void 0);
            };
          }
        return enqueueTaskImpl(task);
      }
      function aggregateErrors(errors) {
        return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
      }
      function popActScope(prevActQueue, prevActScopeDepth) {
        prevActScopeDepth !== actScopeDepth - 1 && console.error(
          "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
        );
        actScopeDepth = prevActScopeDepth;
      }
      function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
        var queue = ReactSharedInternals.actQueue;
        if (null !== queue)
          if (0 !== queue.length)
            try {
              flushActQueue(queue);
              enqueueTask(function() {
                return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
              });
              return;
            } catch (error) {
              ReactSharedInternals.thrownErrors.push(error);
            }
          else ReactSharedInternals.actQueue = null;
        0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
      }
      function flushActQueue(queue) {
        if (!isFlushing) {
          isFlushing = true;
          var i = 0;
          try {
            for (; i < queue.length; i++) {
              var callback = queue[i];
              do {
                ReactSharedInternals.didUsePromise = false;
                var continuation = callback(false);
                if (null !== continuation) {
                  if (ReactSharedInternals.didUsePromise) {
                    queue[i] = callback;
                    queue.splice(0, i);
                    return;
                  }
                  callback = continuation;
                } else break;
              } while (1);
            }
            queue.length = 0;
          } catch (error) {
            queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
          } finally {
            isFlushing = false;
          }
        }
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function(publicInstance) {
          warnNoop(publicInstance, "forceUpdate");
        },
        enqueueReplaceState: function(publicInstance) {
          warnNoop(publicInstance, "replaceState");
        },
        enqueueSetState: function(publicInstance) {
          warnNoop(publicInstance, "setState");
        }
      }, assign = Object.assign, emptyObject = {};
      Object.freeze(emptyObject);
      Component2.prototype.isReactComponent = {};
      Component2.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component2.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      var deprecatedAPIs = {
        isMounted: [
          "isMounted",
          "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
        ],
        replaceState: [
          "replaceState",
          "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
        ]
      };
      for (fnName in deprecatedAPIs)
        deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
      ComponentDummy.prototype = Component2.prototype;
      deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
      deprecatedAPIs.constructor = PureComponent;
      assign(deprecatedAPIs, Component2.prototype);
      deprecatedAPIs.isPureReactComponent = true;
      var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
        H: null,
        A: null,
        T: null,
        S: null,
        actQueue: null,
        asyncTransitions: 0,
        isBatchingLegacy: false,
        didScheduleLegacyUpdate: false,
        didUsePromise: false,
        thrownErrors: [],
        getCurrentStack: null,
        recentlyCreatedOwnerStacks: 0
      }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      deprecatedAPIs = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
        deprecatedAPIs,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
        queueMicrotask(function() {
          return queueMicrotask(callback);
        });
      } : enqueueTask;
      deprecatedAPIs = Object.freeze({
        __proto__: null,
        c: function(size) {
          return resolveDispatcher().useMemoCache(size);
        }
      });
      var fnName = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement2(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = fnName;
      exports.Component = Component2;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = deprecatedAPIs;
      exports.act = function(callback) {
        var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
        actScopeDepth++;
        var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
        try {
          var result = callback();
        } catch (error) {
          ReactSharedInternals.thrownErrors.push(error);
        }
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        if (null !== result && "object" === typeof result && "function" === typeof result.then) {
          var thenable = result;
          queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
            ));
          });
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              thenable.then(
                function(returnValue) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  if (0 === prevActScopeDepth) {
                    try {
                      flushActQueue(queue), enqueueTask(function() {
                        return recursivelyFlushAsyncActWork(
                          returnValue,
                          resolve,
                          reject
                        );
                      });
                    } catch (error$0) {
                      ReactSharedInternals.thrownErrors.push(error$0);
                    }
                    if (0 < ReactSharedInternals.thrownErrors.length) {
                      var _thrownError = aggregateErrors(
                        ReactSharedInternals.thrownErrors
                      );
                      ReactSharedInternals.thrownErrors.length = 0;
                      reject(_thrownError);
                    }
                  } else resolve(returnValue);
                },
                function(error) {
                  popActScope(prevActQueue, prevActScopeDepth);
                  0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                    ReactSharedInternals.thrownErrors
                  ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                }
              );
            }
          };
        }
        var returnValue$jscomp$0 = result;
        popActScope(prevActQueue, prevActScopeDepth);
        0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
          didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
            "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
          ));
        }), ReactSharedInternals.actQueue = null);
        if (0 < ReactSharedInternals.thrownErrors.length)
          throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
        return {
          then: function(resolve, reject) {
            didAwaitActCall = true;
            0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
              return recursivelyFlushAsyncActWork(
                returnValue$jscomp$0,
                resolve,
                reject
              );
            })) : resolve(returnValue$jscomp$0);
          }
        };
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.captureOwnerStack = function() {
        var getCurrentStack = ReactSharedInternals.getCurrentStack;
        return null === getCurrentStack ? null : getCurrentStack();
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign({}, element.props), key = element.key, owner = element._owner;
        if (null != config) {
          var JSCompiler_inline_result;
          a: {
            if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
              config,
              "ref"
            ).get) && JSCompiler_inline_result.isReactWarning) {
              JSCompiler_inline_result = false;
              break a;
            }
            JSCompiler_inline_result = void 0 !== config.ref;
          }
          JSCompiler_inline_result && (owner = getOwner());
          hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
          for (propName in config)
            !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        }
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          JSCompiler_inline_result = Array(propName);
          for (var i = 0; i < propName; i++)
            JSCompiler_inline_result[i] = arguments[i + 2];
          props.children = JSCompiler_inline_result;
        }
        props = ReactElement(
          element.type,
          key,
          props,
          owner,
          element._debugStack,
          element._debugTask
        );
        for (key = 2; key < arguments.length; key++)
          validateChildKeys(arguments[key]);
        return props;
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        defaultValue._currentRenderer = null;
        defaultValue._currentRenderer2 = null;
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        for (var i = 2; i < arguments.length; i++)
          validateChildKeys(arguments[i]);
        i = {};
        var key = null;
        if (null != config)
          for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
            "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
          )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
            hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) i.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
            childArray[_i] = arguments[_i + 2];
          Object.freeze && Object.freeze(childArray);
          i.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === i[propName] && (i[propName] = childrenLength[propName]);
        key && defineKeyPropWarningGetter(
          i,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return ReactElement(
          type,
          key,
          i,
          getOwner(),
          propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.createRef = function() {
        var refObject = { current: null };
        Object.seal(refObject);
        return refObject;
      };
      exports.forwardRef = function(render) {
        null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
          "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
        ) : "function" !== typeof render ? console.error(
          "forwardRef requires a render function but was given %s.",
          null === render ? "null" : typeof render
        ) : 0 !== render.length && 2 !== render.length && console.error(
          "forwardRef render functions accept exactly two parameters: props and ref. %s",
          1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
        );
        null != render && null != render.defaultProps && console.error(
          "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
        );
        var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
        Object.defineProperty(elementType, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
          }
        });
        return elementType;
      };
      exports.isValidElement = isValidElement2;
      exports.lazy = function(ctor) {
        ctor = { _status: -1, _result: ctor };
        var lazyType = {
          $$typeof: REACT_LAZY_TYPE,
          _payload: ctor,
          _init: lazyInitializer
        }, ioInfo = {
          name: "lazy",
          start: -1,
          end: -1,
          value: null,
          owner: null,
          debugStack: Error("react-stack-top-frame"),
          debugTask: console.createTask ? console.createTask("lazy()") : null
        };
        ctor._ioInfo = ioInfo;
        lazyType._debugInfo = [{ awaited: ioInfo }];
        return lazyType;
      };
      exports.memo = function(type, compare) {
        null == type && console.error(
          "memo: The first argument must be a component. Instead received: %s",
          null === type ? "null" : typeof type
        );
        compare = {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
        var ownName;
        Object.defineProperty(compare, "displayName", {
          enumerable: false,
          configurable: true,
          get: function() {
            return ownName;
          },
          set: function(name) {
            ownName = name;
            type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
          }
        });
        return compare;
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        currentTransition._updatedFibers = /* @__PURE__ */ new Set();
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
            "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
          )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
            "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
          ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return resolveDispatcher().useCacheRefresh();
      };
      exports.use = function(usable) {
        return resolveDispatcher().use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return resolveDispatcher().useActionState(
          action,
          initialState,
          permalink
        );
      };
      exports.useCallback = function(callback, deps) {
        return resolveDispatcher().useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        var dispatcher = resolveDispatcher();
        Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
          "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
        );
        return dispatcher.useContext(Context);
      };
      exports.useDebugValue = function(value, formatterFn) {
        return resolveDispatcher().useDebugValue(value, formatterFn);
      };
      exports.useDeferredValue = function(value, initialValue) {
        return resolveDispatcher().useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return resolveDispatcher().useEffectEvent(callback);
      };
      exports.useId = function() {
        return resolveDispatcher().useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return resolveDispatcher().useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        null == create && console.warn(
          "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
        );
        return resolveDispatcher().useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return resolveDispatcher().useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return resolveDispatcher().useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return resolveDispatcher().useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return resolveDispatcher().useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return resolveDispatcher().useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return resolveDispatcher().useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return resolveDispatcher().useTransition();
      };
      exports.version = "19.2.4";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react/index.js
var require_react = __commonJS({
  "node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// node_modules/react-dom/cjs/react-dom.development.js
var require_react_dom_development = __commonJS({
  "node_modules/react-dom/cjs/react-dom.development.js"(exports) {
    "use strict";
    (function() {
      function noop() {
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        try {
          testStringCoercion(key);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        JSCompiler_inline_result && (console.error(
          "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
          "function" === typeof Symbol && Symbol.toStringTag && key[Symbol.toStringTag] || key.constructor.name || "Object"
        ), testStringCoercion(key));
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key: null == key ? null : "" + key,
          children,
          containerInfo,
          implementation
        };
      }
      function getCrossOriginStringAs(as, input) {
        if ("font" === as) return "";
        if ("string" === typeof input)
          return "use-credentials" === input ? input : "";
      }
      function getValueDescriptorExpectingObjectForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : 'something with type "' + typeof thing + '"';
      }
      function getValueDescriptorExpectingEnumForWarning(thing) {
        return null === thing ? "`null`" : void 0 === thing ? "`undefined`" : "" === thing ? "an empty string" : "string" === typeof thing ? JSON.stringify(thing) : "number" === typeof thing ? "`" + thing + "`" : 'something with type "' + typeof thing + '"';
      }
      function resolveDispatcher() {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
        );
        return dispatcher;
      }
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
      var React6 = require_react(), Internals = {
        d: {
          f: noop,
          r: function() {
            throw Error(
              "Invalid form element. requestFormReset must be passed a form that was rendered by React."
            );
          },
          D: noop,
          C: noop,
          L: noop,
          m: noop,
          X: noop,
          S: noop,
          M: noop
        },
        p: 0,
        findDOMNode: null
      }, REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), ReactSharedInternals = React6.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      "function" === typeof Map && null != Map.prototype && "function" === typeof Map.prototype.forEach && "function" === typeof Set && null != Set.prototype && "function" === typeof Set.prototype.clear && "function" === typeof Set.prototype.forEach || console.error(
        "React depends on Map and Set built-in types. Make sure that you load a polyfill in older browsers. https://reactjs.org/link/react-polyfills"
      );
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.createPortal = function(children, container) {
        var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType)
          throw Error("Target container is not a DOM element.");
        return createPortal$1(children, container, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn)
            return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f() && console.error(
            "flushSync was called from inside a lifecycle method. React cannot flush when React is already rendering. Consider moving this call to a scheduler task or micro task."
          );
        }
      };
      exports.preconnect = function(href, options) {
        "string" === typeof href && href ? null != options && "object" !== typeof options ? console.error(
          "ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.",
          getValueDescriptorExpectingEnumForWarning(options)
        ) : null != options && "string" !== typeof options.crossOrigin && console.error(
          "ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.",
          getValueDescriptorExpectingObjectForWarning(options.crossOrigin)
        ) : console.error(
          "ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
          getValueDescriptorExpectingObjectForWarning(href)
        );
        "string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
      };
      exports.prefetchDNS = function(href) {
        if ("string" !== typeof href || !href)
          console.error(
            "ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
            getValueDescriptorExpectingObjectForWarning(href)
          );
        else if (1 < arguments.length) {
          var options = arguments[1];
          "object" === typeof options && options.hasOwnProperty("crossOrigin") ? console.error(
            "ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.",
            getValueDescriptorExpectingEnumForWarning(options)
          ) : console.error(
            "ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.",
            getValueDescriptorExpectingEnumForWarning(options)
          );
        }
        "string" === typeof href && Internals.d.D(href);
      };
      exports.preinit = function(href, options) {
        "string" === typeof href && href ? null == options || "object" !== typeof options ? console.error(
          "ReactDOM.preinit(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preinitialized but encountered %s instead.",
          getValueDescriptorExpectingEnumForWarning(options)
        ) : "style" !== options.as && "script" !== options.as && console.error(
          'ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered %s instead. Valid values for `as` are "style" and "script".',
          getValueDescriptorExpectingEnumForWarning(options.as)
        ) : console.error(
          "ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.",
          getValueDescriptorExpectingObjectForWarning(href)
        );
        if ("string" === typeof href && options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
          "style" === as ? Internals.d.S(
            href,
            "string" === typeof options.precedence ? options.precedence : void 0,
            {
              crossOrigin,
              integrity,
              fetchPriority
            }
          ) : "script" === as && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "script" !== options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingEnumForWarning(options.as) + ".");
        if (encountered)
          console.error(
            "ReactDOM.preinitModule(): Expected up to two arguments, a non-empty `href` string and, optionally, an `options` object with a valid `as` property.%s",
            encountered
          );
        else
          switch (encountered = options && "string" === typeof options.as ? options.as : "script", encountered) {
            case "script":
              break;
            default:
              encountered = getValueDescriptorExpectingEnumForWarning(encountered), console.error(
                'ReactDOM.preinitModule(): Currently the only supported "as" type for this function is "script" but received "%s" instead. This warning was generated for `href` "%s". In the future other module types will be supported, aligning with the import-attributes proposal. Learn more here: (https://github.com/tc39/proposal-import-attributes)',
                encountered,
                href
              );
          }
        if ("string" === typeof href)
          if ("object" === typeof options && null !== options) {
            if (null == options.as || "script" === options.as)
              encountered = getCrossOriginStringAs(
                options.as,
                options.crossOrigin
              ), Internals.d.M(href, {
                crossOrigin: encountered,
                integrity: "string" === typeof options.integrity ? options.integrity : void 0,
                nonce: "string" === typeof options.nonce ? options.nonce : void 0
              });
          } else null == options && Internals.d.M(href);
      };
      exports.preload = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        null == options || "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : "string" === typeof options.as && options.as || (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error(
          'ReactDOM.preload(): Expected two arguments, a non-empty `href` string and an `options` object with an `as` property valid for a `<link rel="preload" as="..." />` tag.%s',
          encountered
        );
        if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
          encountered = options.as;
          var crossOrigin = getCrossOriginStringAs(
            encountered,
            options.crossOrigin
          );
          Internals.d.L(href, encountered, {
            crossOrigin,
            integrity: "string" === typeof options.integrity ? options.integrity : void 0,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0,
            type: "string" === typeof options.type ? options.type : void 0,
            fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
            referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
            imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
            imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
            media: "string" === typeof options.media ? options.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options) {
        var encountered = "";
        "string" === typeof href && href || (encountered += " The `href` argument encountered was " + getValueDescriptorExpectingObjectForWarning(href) + ".");
        void 0 !== options && "object" !== typeof options ? encountered += " The `options` argument encountered was " + getValueDescriptorExpectingObjectForWarning(options) + "." : options && "as" in options && "string" !== typeof options.as && (encountered += " The `as` option encountered was " + getValueDescriptorExpectingObjectForWarning(options.as) + ".");
        encountered && console.error(
          'ReactDOM.preloadModule(): Expected two arguments, a non-empty `href` string and, optionally, an `options` object with an `as` property valid for a `<link rel="modulepreload" as="..." />` tag.%s',
          encountered
        );
        "string" === typeof href && (options ? (encountered = getCrossOriginStringAs(
          options.as,
          options.crossOrigin
        ), Internals.d.m(href, {
          as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
          crossOrigin: encountered,
          integrity: "string" === typeof options.integrity ? options.integrity : void 0
        })) : Internals.d.m(href));
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a) {
        return fn(a);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return resolveDispatcher().useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return resolveDispatcher().useHostTransitionStatus();
      };
      exports.version = "19.2.4";
      "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
    })();
  }
});

// node_modules/react-dom/index.js
var require_react_dom = __commonJS({
  "node_modules/react-dom/index.js"(exports, module) {
    "use strict";
    if (false) {
      checkDCE();
      module.exports = null;
    } else {
      module.exports = require_react_dom_development();
    }
  }
});

// node_modules/react/cjs/react-jsx-runtime.development.js
var require_react_jsx_runtime_development = __commonJS({
  "node_modules/react/cjs/react-jsx-runtime.development.js"(exports) {
    "use strict";
    (function() {
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch ("number" === typeof type.tag && console.error(
            "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
          ), type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      function testStringCoercion(value) {
        return "" + value;
      }
      function checkKeyStringCoercion(value) {
        try {
          testStringCoercion(value);
          var JSCompiler_inline_result = false;
        } catch (e) {
          JSCompiler_inline_result = true;
        }
        if (JSCompiler_inline_result) {
          JSCompiler_inline_result = console;
          var JSCompiler_temp_const = JSCompiler_inline_result.error;
          var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
          JSCompiler_temp_const.call(
            JSCompiler_inline_result,
            "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
            JSCompiler_inline_result$jscomp$0
          );
          return testStringCoercion(value);
        }
      }
      function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
          return "<...>";
        try {
          var name = getComponentNameFromType(type);
          return name ? "<" + name + ">" : "<...>";
        } catch (x) {
          return "<...>";
        }
      }
      function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
      }
      function UnknownOwner() {
        return Error("react-stack-top-frame");
      }
      function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
          var getter = Object.getOwnPropertyDescriptor(config, "key").get;
          if (getter && getter.isReactWarning) return false;
        }
        return void 0 !== config.key;
      }
      function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
          specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
            "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
            displayName
          ));
        }
        warnAboutAccessingKey.isReactWarning = true;
        Object.defineProperty(props, "key", {
          get: warnAboutAccessingKey,
          configurable: true
        });
      }
      function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
          "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
        ));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
      }
      function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          props,
          _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
          enumerable: false,
          get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: null
        });
        Object.defineProperty(type, "_debugStack", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
          configurable: false,
          enumerable: false,
          writable: true,
          value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
      }
      function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children)
          if (isStaticChildren)
            if (isArrayImpl(children)) {
              for (isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)
                validateChildKeys(children[isStaticChildren]);
              Object.freeze && Object.freeze(children);
            } else
              console.error(
                "React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead."
              );
          else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
          children = getComponentNameFromType(type);
          var keys = Object.keys(config).filter(function(k) {
            return "key" !== k;
          });
          isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
          didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error(
            'A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />',
            isStaticChildren,
            children,
            keys,
            children
          ), didWarnAboutKeySpread[children + isStaticChildren] = true);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
          maybeKey = {};
          for (var propName in config)
            "key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(
          maybeKey,
          "function" === typeof type ? type.displayName || type.name || "Unknown" : type
        );
        return ReactElement(
          type,
          children,
          maybeKey,
          getOwner(),
          debugStack,
          debugTask
        );
      }
      function validateChildKeys(node) {
        isValidElement2(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement2(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
      }
      function isValidElement2(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      var React6 = require_react(), REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = React6.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
      };
      React6 = {
        react_stack_bottom_frame: function(callStackForError) {
          return callStackForError();
        }
      };
      var specialPropKeyWarningShown;
      var didWarnAboutElementRef = {};
      var unknownOwnerDebugStack = React6.react_stack_bottom_frame.bind(
        React6,
        UnknownOwner
      )();
      var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
      var didWarnAboutKeySpread = {};
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          false,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
      exports.jsxs = function(type, config, maybeKey) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(
          type,
          config,
          maybeKey,
          true,
          trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
          trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask
        );
      };
    })();
  }
});

// node_modules/react/jsx-runtime.js
var require_jsx_runtime = __commonJS({
  "node_modules/react/jsx-runtime.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_jsx_runtime_development();
    }
  }
});

// src/pages/ProductDetail/index.tsx
var import_react10 = __toESM(require_react(), 1);

// node_modules/react-router-dom/dist/index.js
var React2 = __toESM(require_react());
var ReactDOM = __toESM(require_react_dom());

// node_modules/react-router/dist/index.js
var React = __toESM(require_react());

// node_modules/@remix-run/router/dist/router.js
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var Action;
(function(Action2) {
  Action2["Pop"] = "POP";
  Action2["Push"] = "PUSH";
  Action2["Replace"] = "REPLACE";
})(Action || (Action = {}));
function invariant(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    throw new Error(message);
  }
}
function warning(cond, message) {
  if (!cond) {
    if (typeof console !== "undefined") console.warn(message);
    try {
      throw new Error(message);
    } catch (e) {
    }
  }
}
function createPath(_ref) {
  let {
    pathname = "/",
    search = "",
    hash = ""
  } = _ref;
  if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
  if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
  return pathname;
}
function parsePath(path) {
  let parsedPath = {};
  if (path) {
    let hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
      parsedPath.hash = path.substr(hashIndex);
      path = path.substr(0, hashIndex);
    }
    let searchIndex = path.indexOf("?");
    if (searchIndex >= 0) {
      parsedPath.search = path.substr(searchIndex);
      path = path.substr(0, searchIndex);
    }
    if (path) {
      parsedPath.pathname = path;
    }
  }
  return parsedPath;
}
var ResultType;
(function(ResultType2) {
  ResultType2["data"] = "data";
  ResultType2["deferred"] = "deferred";
  ResultType2["redirect"] = "redirect";
  ResultType2["error"] = "error";
})(ResultType || (ResultType = {}));
function convertRouteMatchToUiMatch(match, loaderData) {
  let {
    route,
    pathname,
    params
  } = match;
  return {
    id: route.id,
    pathname,
    params,
    data: loaderData[route.id],
    handle: route.handle
  };
}
function matchPath(pattern, pathname) {
  if (typeof pattern === "string") {
    pattern = {
      path: pattern,
      caseSensitive: false,
      end: true
    };
  }
  let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
  let match = pathname.match(matcher);
  if (!match) return null;
  let matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
  let captureGroups = match.slice(1);
  let params = compiledParams.reduce((memo2, _ref, index) => {
    let {
      paramName,
      isOptional
    } = _ref;
    if (paramName === "*") {
      let splatValue = captureGroups[index] || "";
      pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
    }
    const value = captureGroups[index];
    if (isOptional && !value) {
      memo2[paramName] = void 0;
    } else {
      memo2[paramName] = (value || "").replace(/%2F/g, "/");
    }
    return memo2;
  }, {});
  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}
function compilePath(path, caseSensitive, end) {
  if (caseSensitive === void 0) {
    caseSensitive = false;
  }
  if (end === void 0) {
    end = true;
  }
  warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), 'Route path "' + path + '" will be treated as if it were ' + ('"' + path.replace(/\*$/, "/*") + '" because the `*` character must ') + "always follow a `/` in the pattern. To get rid of this warning, " + ('please change the route path to "' + path.replace(/\*$/, "/*") + '".'));
  let params = [];
  let regexpSource = "^" + path.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional) => {
    params.push({
      paramName,
      isOptional: isOptional != null
    });
    return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
  });
  if (path.endsWith("*")) {
    params.push({
      paramName: "*"
    });
    regexpSource += path === "*" || path === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$";
  } else if (end) {
    regexpSource += "\\/*$";
  } else if (path !== "" && path !== "/") {
    regexpSource += "(?:(?=\\/|$))";
  } else ;
  let matcher = new RegExp(regexpSource, caseSensitive ? void 0 : "i");
  return [matcher, params];
}
function stripBasename(pathname, basename) {
  if (basename === "/") return pathname;
  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }
  let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
  let nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== "/") {
    return null;
  }
  return pathname.slice(startIndex) || "/";
}
var ABSOLUTE_URL_REGEX$1 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
var isAbsoluteUrl = (url) => ABSOLUTE_URL_REGEX$1.test(url);
function resolvePath(to, fromPathname) {
  if (fromPathname === void 0) {
    fromPathname = "/";
  }
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;
  let pathname;
  if (toPathname) {
    if (isAbsoluteUrl(toPathname)) {
      pathname = toPathname;
    } else {
      if (toPathname.includes("//")) {
        let oldPathname = toPathname;
        toPathname = toPathname.replace(/\/\/+/g, "/");
        warning(false, "Pathnames cannot have embedded double slashes - normalizing " + (oldPathname + " -> " + toPathname));
      }
      if (toPathname.startsWith("/")) {
        pathname = resolvePathname(toPathname.substring(1), "/");
      } else {
        pathname = resolvePathname(toPathname, fromPathname);
      }
    }
  } else {
    pathname = fromPathname;
  }
  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash)
  };
}
function resolvePathname(relativePath, fromPathname) {
  let segments = fromPathname.replace(/\/+$/, "").split("/");
  let relativeSegments = relativePath.split("/");
  relativeSegments.forEach((segment) => {
    if (segment === "..") {
      if (segments.length > 1) segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });
  return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
  return "Cannot include a '" + char + "' character in a manually specified " + ("`to." + field + "` field [" + JSON.stringify(path) + "].  Please separate it out to the ") + ("`to." + dest + "` field. Alternatively you may provide the full path as ") + 'a string in <Link to="..."> and the router will parse it for you.';
}
function getPathContributingMatches(matches) {
  return matches.filter((match, index) => index === 0 || match.route.path && match.route.path.length > 0);
}
function getResolveToMatches(matches, v7_relativeSplatPath) {
  let pathMatches = getPathContributingMatches(matches);
  if (v7_relativeSplatPath) {
    return pathMatches.map((match, idx) => idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
  }
  return pathMatches.map((match) => match.pathnameBase);
}
function resolveTo(toArg, routePathnames, locationPathname, isPathRelative) {
  if (isPathRelative === void 0) {
    isPathRelative = false;
  }
  let to;
  if (typeof toArg === "string") {
    to = parsePath(toArg);
  } else {
    to = _extends({}, toArg);
    invariant(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
    invariant(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
    invariant(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
  }
  let isEmptyPath = toArg === "" || to.pathname === "";
  let toPathname = isEmptyPath ? "/" : to.pathname;
  let from;
  if (toPathname == null) {
    from = locationPathname;
  } else {
    let routePathnameIndex = routePathnames.length - 1;
    if (!isPathRelative && toPathname.startsWith("..")) {
      let toSegments = toPathname.split("/");
      while (toSegments[0] === "..") {
        toSegments.shift();
        routePathnameIndex -= 1;
      }
      to.pathname = toSegments.join("/");
    }
    from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
  }
  let path = resolvePath(to, from);
  let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
  let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
  if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) {
    path.pathname += "/";
  }
  return path;
}
var joinPaths = (paths) => paths.join("/").replace(/\/\/+/g, "/");
var normalizeSearch = (search) => !search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
var normalizeHash = (hash) => !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
var validMutationMethodsArr = ["post", "put", "patch", "delete"];
var validMutationMethods = new Set(validMutationMethodsArr);
var validRequestMethodsArr = ["get", ...validMutationMethodsArr];
var validRequestMethods = new Set(validRequestMethodsArr);

// node_modules/react-router/dist/index.js
function _extends2() {
  _extends2 = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends2.apply(this, arguments);
}
var DataRouterContext = /* @__PURE__ */ React.createContext(null);
if (true) {
  DataRouterContext.displayName = "DataRouter";
}
var DataRouterStateContext = /* @__PURE__ */ React.createContext(null);
if (true) {
  DataRouterStateContext.displayName = "DataRouterState";
}
var AwaitContext = /* @__PURE__ */ React.createContext(null);
if (true) {
  AwaitContext.displayName = "Await";
}
var NavigationContext = /* @__PURE__ */ React.createContext(null);
if (true) {
  NavigationContext.displayName = "Navigation";
}
var LocationContext = /* @__PURE__ */ React.createContext(null);
if (true) {
  LocationContext.displayName = "Location";
}
var RouteContext = /* @__PURE__ */ React.createContext({
  outlet: null,
  matches: [],
  isDataRoute: false
});
if (true) {
  RouteContext.displayName = "Route";
}
var RouteErrorContext = /* @__PURE__ */ React.createContext(null);
if (true) {
  RouteErrorContext.displayName = "RouteError";
}
function useHref(to, _temp) {
  let {
    relative
  } = _temp === void 0 ? {} : _temp;
  !useInRouterContext() ? true ? invariant(
    false,
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useHref() may be used only in the context of a <Router> component."
  ) : invariant(false) : void 0;
  let {
    basename,
    navigator: navigator2
  } = React.useContext(NavigationContext);
  let {
    hash,
    pathname,
    search
  } = useResolvedPath(to, {
    relative
  });
  let joinedPathname = pathname;
  if (basename !== "/") {
    joinedPathname = pathname === "/" ? basename : joinPaths([basename, pathname]);
  }
  return navigator2.createHref({
    pathname: joinedPathname,
    search,
    hash
  });
}
function useInRouterContext() {
  return React.useContext(LocationContext) != null;
}
function useLocation() {
  !useInRouterContext() ? true ? invariant(
    false,
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useLocation() may be used only in the context of a <Router> component."
  ) : invariant(false) : void 0;
  return React.useContext(LocationContext).location;
}
var navigateEffectWarning = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function useIsomorphicLayoutEffect(cb) {
  let isStatic = React.useContext(NavigationContext).static;
  if (!isStatic) {
    React.useLayoutEffect(cb);
  }
}
function useNavigate() {
  let {
    isDataRoute
  } = React.useContext(RouteContext);
  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
  !useInRouterContext() ? true ? invariant(
    false,
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    "useNavigate() may be used only in the context of a <Router> component."
  ) : invariant(false) : void 0;
  let dataRouterContext = React.useContext(DataRouterContext);
  let {
    basename,
    future,
    navigator: navigator2
  } = React.useContext(NavigationContext);
  let {
    matches
  } = React.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
  let activeRef = React.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = React.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    true ? warning(activeRef.current, navigateEffectWarning) : void 0;
    if (!activeRef.current) return;
    if (typeof to === "number") {
      navigator2.go(to);
      return;
    }
    let path = resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
    if (dataRouterContext == null && basename !== "/") {
      path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
    }
    (!!options.replace ? navigator2.replace : navigator2.push)(path, options.state, options);
  }, [basename, navigator2, routePathnamesJson, locationPathname, dataRouterContext]);
  return navigate;
}
function useParams() {
  let {
    matches
  } = React.useContext(RouteContext);
  let routeMatch = matches[matches.length - 1];
  return routeMatch ? routeMatch.params : {};
}
function useResolvedPath(to, _temp2) {
  let {
    relative
  } = _temp2 === void 0 ? {} : _temp2;
  let {
    future
  } = React.useContext(NavigationContext);
  let {
    matches
  } = React.useContext(RouteContext);
  let {
    pathname: locationPathname
  } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches, future.v7_relativeSplatPath));
  return React.useMemo(() => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [to, routePathnamesJson, locationPathname, relative]);
}
var DataRouterHook = /* @__PURE__ */ (function(DataRouterHook3) {
  DataRouterHook3["UseBlocker"] = "useBlocker";
  DataRouterHook3["UseRevalidator"] = "useRevalidator";
  DataRouterHook3["UseNavigateStable"] = "useNavigate";
  return DataRouterHook3;
})(DataRouterHook || {});
var DataRouterStateHook = /* @__PURE__ */ (function(DataRouterStateHook3) {
  DataRouterStateHook3["UseBlocker"] = "useBlocker";
  DataRouterStateHook3["UseLoaderData"] = "useLoaderData";
  DataRouterStateHook3["UseActionData"] = "useActionData";
  DataRouterStateHook3["UseRouteError"] = "useRouteError";
  DataRouterStateHook3["UseNavigation"] = "useNavigation";
  DataRouterStateHook3["UseRouteLoaderData"] = "useRouteLoaderData";
  DataRouterStateHook3["UseMatches"] = "useMatches";
  DataRouterStateHook3["UseRevalidator"] = "useRevalidator";
  DataRouterStateHook3["UseNavigateStable"] = "useNavigate";
  DataRouterStateHook3["UseRouteId"] = "useRouteId";
  return DataRouterStateHook3;
})(DataRouterStateHook || {});
function getDataRouterConsoleError(hookName) {
  return hookName + " must be used within a data router.  See https://reactrouter.com/v6/routers/picking-a-router.";
}
function useDataRouterContext(hookName) {
  let ctx = React.useContext(DataRouterContext);
  !ctx ? true ? invariant(false, getDataRouterConsoleError(hookName)) : invariant(false) : void 0;
  return ctx;
}
function useDataRouterState(hookName) {
  let state = React.useContext(DataRouterStateContext);
  !state ? true ? invariant(false, getDataRouterConsoleError(hookName)) : invariant(false) : void 0;
  return state;
}
function useRouteContext(hookName) {
  let route = React.useContext(RouteContext);
  !route ? true ? invariant(false, getDataRouterConsoleError(hookName)) : invariant(false) : void 0;
  return route;
}
function useCurrentRouteId(hookName) {
  let route = useRouteContext(hookName);
  let thisRoute = route.matches[route.matches.length - 1];
  !thisRoute.route.id ? true ? invariant(false, hookName + ' can only be used on routes that contain a unique "id"') : invariant(false) : void 0;
  return thisRoute.route.id;
}
function useRouteId() {
  return useCurrentRouteId(DataRouterStateHook.UseRouteId);
}
function useNavigation() {
  let state = useDataRouterState(DataRouterStateHook.UseNavigation);
  return state.navigation;
}
function useMatches() {
  let {
    matches,
    loaderData
  } = useDataRouterState(DataRouterStateHook.UseMatches);
  return React.useMemo(() => matches.map((m) => convertRouteMatchToUiMatch(m, loaderData)), [matches, loaderData]);
}
function useNavigateStable() {
  let {
    router
  } = useDataRouterContext(DataRouterHook.UseNavigateStable);
  let id = useCurrentRouteId(DataRouterStateHook.UseNavigateStable);
  let activeRef = React.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });
  let navigate = React.useCallback(function(to, options) {
    if (options === void 0) {
      options = {};
    }
    true ? warning(activeRef.current, navigateEffectWarning) : void 0;
    if (!activeRef.current) return;
    if (typeof to === "number") {
      router.navigate(to);
    } else {
      router.navigate(to, _extends2({
        fromRouteId: id
      }, options));
    }
  }, [router, id]);
  return navigate;
}
var alreadyWarned = {};
function warnOnce(key, message) {
  if (!alreadyWarned[message]) {
    alreadyWarned[message] = true;
    console.warn(message);
  }
}
var logDeprecation = (flag, msg, link) => warnOnce(flag, "\u26A0\uFE0F React Router Future Flag Warning: " + msg + ". " + ("You can use the `" + flag + "` future flag to opt-in early. ") + ("For more information, see " + link + "."));
function logV6DeprecationWarnings(renderFuture, routerFuture) {
  if ((renderFuture == null ? void 0 : renderFuture.v7_startTransition) === void 0) {
    logDeprecation("v7_startTransition", "React Router will begin wrapping state updates in `React.startTransition` in v7", "https://reactrouter.com/v6/upgrading/future#v7_starttransition");
  }
  if ((renderFuture == null ? void 0 : renderFuture.v7_relativeSplatPath) === void 0 && (!routerFuture || routerFuture.v7_relativeSplatPath === void 0)) {
    logDeprecation("v7_relativeSplatPath", "Relative route resolution within Splat routes is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath");
  }
  if (routerFuture) {
    if (routerFuture.v7_fetcherPersist === void 0) {
      logDeprecation("v7_fetcherPersist", "The persistence behavior of fetchers is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_fetcherpersist");
    }
    if (routerFuture.v7_normalizeFormMethod === void 0) {
      logDeprecation("v7_normalizeFormMethod", "Casing of `formMethod` fields is being normalized to uppercase in v7", "https://reactrouter.com/v6/upgrading/future#v7_normalizeformmethod");
    }
    if (routerFuture.v7_partialHydration === void 0) {
      logDeprecation("v7_partialHydration", "`RouterProvider` hydration behavior is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_partialhydration");
    }
    if (routerFuture.v7_skipActionErrorRevalidation === void 0) {
      logDeprecation("v7_skipActionErrorRevalidation", "The revalidation behavior after 4xx/5xx `action` responses is changing in v7", "https://reactrouter.com/v6/upgrading/future#v7_skipactionerrorrevalidation");
    }
  }
}
var START_TRANSITION = "startTransition";
var startTransitionImpl = React[START_TRANSITION];
function Router(_ref5) {
  let {
    basename: basenameProp = "/",
    children = null,
    location: locationProp,
    navigationType = Action.Pop,
    navigator: navigator2,
    static: staticProp = false,
    future
  } = _ref5;
  !!useInRouterContext() ? true ? invariant(false, "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.") : invariant(false) : void 0;
  let basename = basenameProp.replace(/^\/*/, "/");
  let navigationContext = React.useMemo(() => ({
    basename,
    navigator: navigator2,
    static: staticProp,
    future: _extends2({
      v7_relativeSplatPath: false
    }, future)
  }), [basename, future, navigator2, staticProp]);
  if (typeof locationProp === "string") {
    locationProp = parsePath(locationProp);
  }
  let {
    pathname = "/",
    search = "",
    hash = "",
    state = null,
    key = "default"
  } = locationProp;
  let locationContext = React.useMemo(() => {
    let trailingPathname = stripBasename(pathname, basename);
    if (trailingPathname == null) {
      return null;
    }
    return {
      location: {
        pathname: trailingPathname,
        search,
        hash,
        state,
        key
      },
      navigationType
    };
  }, [basename, pathname, search, hash, state, key, navigationType]);
  true ? warning(locationContext != null, '<Router basename="' + basename + '"> is not able to match the URL ' + ('"' + pathname + search + hash + '" because it does not start with the ') + "basename, so the <Router> won't render anything.") : void 0;
  if (locationContext == null) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(NavigationContext.Provider, {
    value: navigationContext
  }, /* @__PURE__ */ React.createElement(LocationContext.Provider, {
    children,
    value: locationContext
  }));
}
var neverSettledPromise = new Promise(() => {
});

// node_modules/react-router-dom/dist/index.js
function _extends3() {
  _extends3 = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends3.apply(this, arguments);
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}
var defaultMethod = "get";
var defaultEncType = "application/x-www-form-urlencoded";
function isHtmlElement(object) {
  return object != null && typeof object.tagName === "string";
}
function isButtonElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}
function isFormElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}
function isInputElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
  return event.button === 0 && // Ignore everything but left clicks
  (!target || target === "_self") && // Let browser handle "target=_blank" etc.
  !isModifiedEvent(event);
}
var _formDataSupportsSubmitter = null;
function isFormDataSubmitterSupported() {
  if (_formDataSupportsSubmitter === null) {
    try {
      new FormData(
        document.createElement("form"),
        // @ts-expect-error if FormData supports the submitter parameter, this will throw
        0
      );
      _formDataSupportsSubmitter = false;
    } catch (e) {
      _formDataSupportsSubmitter = true;
    }
  }
  return _formDataSupportsSubmitter;
}
var supportedFormEncTypes = /* @__PURE__ */ new Set(["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]);
function getFormEncType(encType) {
  if (encType != null && !supportedFormEncTypes.has(encType)) {
    true ? warning(false, '"' + encType + '" is not a valid `encType` for `<Form>`/`<fetcher.Form>` ' + ('and will default to "' + defaultEncType + '"')) : void 0;
    return null;
  }
  return encType;
}
function getFormSubmissionInfo(target, basename) {
  let method;
  let action;
  let encType;
  let formData;
  let body;
  if (isFormElement(target)) {
    let attr = target.getAttribute("action");
    action = attr ? stripBasename(attr, basename) : null;
    method = target.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(target);
  } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
    let form = target.form;
    if (form == null) {
      throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');
    }
    let attr = target.getAttribute("formaction") || form.getAttribute("action");
    action = attr ? stripBasename(attr, basename) : null;
    method = target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(form, target);
    if (!isFormDataSubmitterSupported()) {
      let {
        name,
        type,
        value
      } = target;
      if (type === "image") {
        let prefix = name ? name + "." : "";
        formData.append(prefix + "x", "0");
        formData.append(prefix + "y", "0");
      } else if (name) {
        formData.append(name, value);
      }
    }
  } else if (isHtmlElement(target)) {
    throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
  } else {
    method = defaultMethod;
    action = null;
    encType = defaultEncType;
    body = target;
  }
  if (formData && encType === "text/plain") {
    body = formData;
    formData = void 0;
  }
  return {
    action,
    method: method.toLowerCase(),
    encType,
    formData,
    body
  };
}
var _excluded = ["onClick", "relative", "reloadDocument", "replace", "state", "target", "to", "preventScrollReset", "viewTransition"];
var _excluded2 = ["aria-current", "caseSensitive", "className", "end", "style", "to", "viewTransition", "children"];
var _excluded3 = ["fetcherKey", "navigate", "reloadDocument", "replace", "state", "method", "action", "onSubmit", "relative", "preventScrollReset", "viewTransition"];
var REACT_ROUTER_VERSION = "6";
try {
  window.__reactRouterVersion = REACT_ROUTER_VERSION;
} catch (e) {
}
var ViewTransitionContext = /* @__PURE__ */ React2.createContext({
  isTransitioning: false
});
if (true) {
  ViewTransitionContext.displayName = "ViewTransition";
}
var FetchersContext = /* @__PURE__ */ React2.createContext(/* @__PURE__ */ new Map());
if (true) {
  FetchersContext.displayName = "Fetchers";
}
var START_TRANSITION2 = "startTransition";
var startTransitionImpl2 = React2[START_TRANSITION2];
var FLUSH_SYNC = "flushSync";
var flushSyncImpl = ReactDOM[FLUSH_SYNC];
var USE_ID = "useId";
var useIdImpl = React2[USE_ID];
function HistoryRouter(_ref6) {
  let {
    basename,
    children,
    future,
    history
  } = _ref6;
  let [state, setStateImpl] = React2.useState({
    action: history.action,
    location: history.location
  });
  let {
    v7_startTransition
  } = future || {};
  let setState = React2.useCallback((newState) => {
    v7_startTransition && startTransitionImpl2 ? startTransitionImpl2(() => setStateImpl(newState)) : setStateImpl(newState);
  }, [setStateImpl, v7_startTransition]);
  React2.useLayoutEffect(() => history.listen(setState), [history, setState]);
  React2.useEffect(() => logV6DeprecationWarnings(future), [future]);
  return /* @__PURE__ */ React2.createElement(Router, {
    basename,
    children,
    location: state.location,
    navigationType: state.action,
    navigator: history,
    future
  });
}
if (true) {
  HistoryRouter.displayName = "unstable_HistoryRouter";
}
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
var ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
var Link = /* @__PURE__ */ React2.forwardRef(function LinkWithRef(_ref7, ref) {
  let {
    onClick,
    relative,
    reloadDocument,
    replace: replace2,
    state,
    target,
    to,
    preventScrollReset,
    viewTransition
  } = _ref7, rest = _objectWithoutPropertiesLoose(_ref7, _excluded);
  let {
    basename
  } = React2.useContext(NavigationContext);
  let absoluteHref;
  let isExternal = false;
  if (typeof to === "string" && ABSOLUTE_URL_REGEX.test(to)) {
    absoluteHref = to;
    if (isBrowser) {
      try {
        let currentUrl = new URL(window.location.href);
        let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
        let path = stripBasename(targetUrl.pathname, basename);
        if (targetUrl.origin === currentUrl.origin && path != null) {
          to = path + targetUrl.search + targetUrl.hash;
        } else {
          isExternal = true;
        }
      } catch (e) {
        true ? warning(false, '<Link to="' + to + '"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.') : void 0;
      }
    }
  }
  let href = useHref(to, {
    relative
  });
  let internalOnClick = useLinkClickHandler(to, {
    replace: replace2,
    state,
    target,
    preventScrollReset,
    relative,
    viewTransition
  });
  function handleClick(event) {
    if (onClick) onClick(event);
    if (!event.defaultPrevented) {
      internalOnClick(event);
    }
  }
  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    /* @__PURE__ */ React2.createElement("a", _extends3({}, rest, {
      href: absoluteHref || href,
      onClick: isExternal || reloadDocument ? onClick : handleClick,
      ref,
      target
    }))
  );
});
if (true) {
  Link.displayName = "Link";
}
var NavLink = /* @__PURE__ */ React2.forwardRef(function NavLinkWithRef(_ref8, ref) {
  let {
    "aria-current": ariaCurrentProp = "page",
    caseSensitive = false,
    className: classNameProp = "",
    end = false,
    style: styleProp,
    to,
    viewTransition,
    children
  } = _ref8, rest = _objectWithoutPropertiesLoose(_ref8, _excluded2);
  let path = useResolvedPath(to, {
    relative: rest.relative
  });
  let location = useLocation();
  let routerState = React2.useContext(DataRouterStateContext);
  let {
    navigator: navigator2,
    basename
  } = React2.useContext(NavigationContext);
  let isTransitioning = routerState != null && // Conditional usage is OK here because the usage of a data router is static
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useViewTransitionState(path) && viewTransition === true;
  let toPathname = navigator2.encodeLocation ? navigator2.encodeLocation(path).pathname : path.pathname;
  let locationPathname = location.pathname;
  let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
  if (!caseSensitive) {
    locationPathname = locationPathname.toLowerCase();
    nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
    toPathname = toPathname.toLowerCase();
  }
  if (nextLocationPathname && basename) {
    nextLocationPathname = stripBasename(nextLocationPathname, basename) || nextLocationPathname;
  }
  const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
  let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
  let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
  let renderProps = {
    isActive,
    isPending,
    isTransitioning
  };
  let ariaCurrent = isActive ? ariaCurrentProp : void 0;
  let className;
  if (typeof classNameProp === "function") {
    className = classNameProp(renderProps);
  } else {
    className = [classNameProp, isActive ? "active" : null, isPending ? "pending" : null, isTransitioning ? "transitioning" : null].filter(Boolean).join(" ");
  }
  let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
  return /* @__PURE__ */ React2.createElement(Link, _extends3({}, rest, {
    "aria-current": ariaCurrent,
    className,
    ref,
    style,
    to,
    viewTransition
  }), typeof children === "function" ? children(renderProps) : children);
});
if (true) {
  NavLink.displayName = "NavLink";
}
var Form = /* @__PURE__ */ React2.forwardRef((_ref9, forwardedRef) => {
  let {
    fetcherKey,
    navigate,
    reloadDocument,
    replace: replace2,
    state,
    method = defaultMethod,
    action,
    onSubmit,
    relative,
    preventScrollReset,
    viewTransition
  } = _ref9, props = _objectWithoutPropertiesLoose(_ref9, _excluded3);
  let submit = useSubmit();
  let formAction = useFormAction(action, {
    relative
  });
  let formMethod = method.toLowerCase() === "get" ? "get" : "post";
  let submitHandler = (event) => {
    onSubmit && onSubmit(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    let submitter = event.nativeEvent.submitter;
    let submitMethod = (submitter == null ? void 0 : submitter.getAttribute("formmethod")) || method;
    submit(submitter || event.currentTarget, {
      fetcherKey,
      method: submitMethod,
      navigate,
      replace: replace2,
      state,
      relative,
      preventScrollReset,
      viewTransition
    });
  };
  return /* @__PURE__ */ React2.createElement("form", _extends3({
    ref: forwardedRef,
    method: formMethod,
    action: formAction,
    onSubmit: reloadDocument ? onSubmit : submitHandler
  }, props));
});
if (true) {
  Form.displayName = "Form";
}
function ScrollRestoration(_ref10) {
  let {
    getKey,
    storageKey
  } = _ref10;
  useScrollRestoration({
    getKey,
    storageKey
  });
  return null;
}
if (true) {
  ScrollRestoration.displayName = "ScrollRestoration";
}
var DataRouterHook2;
(function(DataRouterHook3) {
  DataRouterHook3["UseScrollRestoration"] = "useScrollRestoration";
  DataRouterHook3["UseSubmit"] = "useSubmit";
  DataRouterHook3["UseSubmitFetcher"] = "useSubmitFetcher";
  DataRouterHook3["UseFetcher"] = "useFetcher";
  DataRouterHook3["useViewTransitionState"] = "useViewTransitionState";
})(DataRouterHook2 || (DataRouterHook2 = {}));
var DataRouterStateHook2;
(function(DataRouterStateHook3) {
  DataRouterStateHook3["UseFetcher"] = "useFetcher";
  DataRouterStateHook3["UseFetchers"] = "useFetchers";
  DataRouterStateHook3["UseScrollRestoration"] = "useScrollRestoration";
})(DataRouterStateHook2 || (DataRouterStateHook2 = {}));
function getDataRouterConsoleError2(hookName) {
  return hookName + " must be used within a data router.  See https://reactrouter.com/v6/routers/picking-a-router.";
}
function useDataRouterContext2(hookName) {
  let ctx = React2.useContext(DataRouterContext);
  !ctx ? true ? invariant(false, getDataRouterConsoleError2(hookName)) : invariant(false) : void 0;
  return ctx;
}
function useDataRouterState2(hookName) {
  let state = React2.useContext(DataRouterStateContext);
  !state ? true ? invariant(false, getDataRouterConsoleError2(hookName)) : invariant(false) : void 0;
  return state;
}
function useLinkClickHandler(to, _temp) {
  let {
    target,
    replace: replaceProp,
    state,
    preventScrollReset,
    relative,
    viewTransition
  } = _temp === void 0 ? {} : _temp;
  let navigate = useNavigate();
  let location = useLocation();
  let path = useResolvedPath(to, {
    relative
  });
  return React2.useCallback((event) => {
    if (shouldProcessLinkClick(event, target)) {
      event.preventDefault();
      let replace2 = replaceProp !== void 0 ? replaceProp : createPath(location) === createPath(path);
      navigate(to, {
        replace: replace2,
        state,
        preventScrollReset,
        relative,
        viewTransition
      });
    }
  }, [location, navigate, path, replaceProp, state, target, to, preventScrollReset, relative, viewTransition]);
}
function validateClientSideSubmission() {
  if (typeof document === "undefined") {
    throw new Error("You are calling submit during the server render. Try calling submit within a `useEffect` or callback instead.");
  }
}
var fetcherId = 0;
var getUniqueFetcherId = () => "__" + String(++fetcherId) + "__";
function useSubmit() {
  let {
    router
  } = useDataRouterContext2(DataRouterHook2.UseSubmit);
  let {
    basename
  } = React2.useContext(NavigationContext);
  let currentRouteId = useRouteId();
  return React2.useCallback(function(target, options) {
    if (options === void 0) {
      options = {};
    }
    validateClientSideSubmission();
    let {
      action,
      method,
      encType,
      formData,
      body
    } = getFormSubmissionInfo(target, basename);
    if (options.navigate === false) {
      let key = options.fetcherKey || getUniqueFetcherId();
      router.fetch(key, currentRouteId, options.action || action, {
        preventScrollReset: options.preventScrollReset,
        formData,
        body,
        formMethod: options.method || method,
        formEncType: options.encType || encType,
        flushSync: options.flushSync
      });
    } else {
      router.navigate(options.action || action, {
        preventScrollReset: options.preventScrollReset,
        formData,
        body,
        formMethod: options.method || method,
        formEncType: options.encType || encType,
        replace: options.replace,
        state: options.state,
        fromRouteId: currentRouteId,
        flushSync: options.flushSync,
        viewTransition: options.viewTransition
      });
    }
  }, [router, basename, currentRouteId]);
}
function useFormAction(action, _temp2) {
  let {
    relative
  } = _temp2 === void 0 ? {} : _temp2;
  let {
    basename
  } = React2.useContext(NavigationContext);
  let routeContext = React2.useContext(RouteContext);
  !routeContext ? true ? invariant(false, "useFormAction must be used inside a RouteContext") : invariant(false) : void 0;
  let [match] = routeContext.matches.slice(-1);
  let path = _extends3({}, useResolvedPath(action ? action : ".", {
    relative
  }));
  let location = useLocation();
  if (action == null) {
    path.search = location.search;
    let params = new URLSearchParams(path.search);
    let indexValues = params.getAll("index");
    let hasNakedIndexParam = indexValues.some((v) => v === "");
    if (hasNakedIndexParam) {
      params.delete("index");
      indexValues.filter((v) => v).forEach((v) => params.append("index", v));
      let qs = params.toString();
      path.search = qs ? "?" + qs : "";
    }
  }
  if ((!action || action === ".") && match.route.index) {
    path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
  }
  if (basename !== "/") {
    path.pathname = path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
  }
  return createPath(path);
}
var SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
var savedScrollPositions = {};
function useScrollRestoration(_temp4) {
  let {
    getKey,
    storageKey
  } = _temp4 === void 0 ? {} : _temp4;
  let {
    router
  } = useDataRouterContext2(DataRouterHook2.UseScrollRestoration);
  let {
    restoreScrollPosition,
    preventScrollReset
  } = useDataRouterState2(DataRouterStateHook2.UseScrollRestoration);
  let {
    basename
  } = React2.useContext(NavigationContext);
  let location = useLocation();
  let matches = useMatches();
  let navigation = useNavigation();
  React2.useEffect(() => {
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);
  usePageHide(React2.useCallback(() => {
    if (navigation.state === "idle") {
      let key = (getKey ? getKey(location, matches) : null) || location.key;
      savedScrollPositions[key] = window.scrollY;
    }
    try {
      sessionStorage.setItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY, JSON.stringify(savedScrollPositions));
    } catch (error) {
      true ? warning(false, "Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (" + error + ").") : void 0;
    }
    window.history.scrollRestoration = "auto";
  }, [storageKey, getKey, navigation.state, location, matches]));
  if (typeof document !== "undefined") {
    React2.useLayoutEffect(() => {
      try {
        let sessionPositions = sessionStorage.getItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY);
        if (sessionPositions) {
          savedScrollPositions = JSON.parse(sessionPositions);
        }
      } catch (e) {
      }
    }, [storageKey]);
    React2.useLayoutEffect(() => {
      let getKeyWithoutBasename = getKey && basename !== "/" ? (location2, matches2) => getKey(
        // Strip the basename to match useLocation()
        _extends3({}, location2, {
          pathname: stripBasename(location2.pathname, basename) || location2.pathname
        }),
        matches2
      ) : getKey;
      let disableScrollRestoration = router == null ? void 0 : router.enableScrollRestoration(savedScrollPositions, () => window.scrollY, getKeyWithoutBasename);
      return () => disableScrollRestoration && disableScrollRestoration();
    }, [router, basename, getKey]);
    React2.useLayoutEffect(() => {
      if (restoreScrollPosition === false) {
        return;
      }
      if (typeof restoreScrollPosition === "number") {
        window.scrollTo(0, restoreScrollPosition);
        return;
      }
      if (location.hash) {
        let el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (el) {
          el.scrollIntoView();
          return;
        }
      }
      if (preventScrollReset === true) {
        return;
      }
      window.scrollTo(0, 0);
    }, [location, restoreScrollPosition, preventScrollReset]);
  }
}
function usePageHide(callback, options) {
  let {
    capture
  } = options || {};
  React2.useEffect(() => {
    let opts = capture != null ? {
      capture
    } : void 0;
    window.addEventListener("pagehide", callback, opts);
    return () => {
      window.removeEventListener("pagehide", callback, opts);
    };
  }, [callback, capture]);
}
function useViewTransitionState(to, opts) {
  if (opts === void 0) {
    opts = {};
  }
  let vtContext = React2.useContext(ViewTransitionContext);
  !(vtContext != null) ? true ? invariant(false, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?") : invariant(false) : void 0;
  let {
    basename
  } = useDataRouterContext2(DataRouterHook2.useViewTransitionState);
  let path = useResolvedPath(to, {
    relative: opts.relative
  });
  if (!vtContext.isTransitioning) {
    return false;
  }
  let currentPath = stripBasename(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
  let nextPath = stripBasename(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
  return matchPath(path.pathname, nextPath) != null || matchPath(path.pathname, currentPath) != null;
}

// src/api/core/errors.ts
var ApiError = class extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
};
function isAbortError(error) {
  return error instanceof Error && error.name === "AbortError";
}
function getErrorMessage(error) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Request failed. Please try again.";
}

// src/api/config.ts
var DEFAULT_API_BASE_URL = "";
function toNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : fallback;
}
function toBoolean(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalizedValue = value.trim().toLowerCase();
  if (normalizedValue === "true") {
    return true;
  }
  if (normalizedValue === "false") {
    return false;
  }
  return fallback;
}
var apiConfig = {
  baTokenStorageKey: import.meta.env.VITE_API_BA_TOKEN_KEY?.trim() || "ba-token",
  baUserTokenStorageKey: import.meta.env.VITE_API_BA_USER_TOKEN_KEY?.trim() || "ba-user-token",
  baseURL: import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
  mockDelay: toNumber(import.meta.env.VITE_API_MOCK_DELAY, 250),
  timeout: toNumber(import.meta.env.VITE_API_TIMEOUT, 1e4),
  tokenStorageKey: import.meta.env.VITE_API_TOKEN_KEY?.trim() || "access_token",
  useMock: toBoolean(import.meta.env.VITE_API_USE_MOCK, false)
};

// src/api/core/headers.ts
function getStorageValue(key) {
  if (typeof window === "undefined") {
    return void 0;
  }
  const value = window.localStorage.getItem(key)?.trim();
  return value || void 0;
}
function createApiHeaders(options = {}) {
  const headers = {};
  const baToken = options.baToken ?? getStorageValue(apiConfig.baTokenStorageKey);
  const baUserToken = options.baUserToken ?? getStorageValue(apiConfig.baUserTokenStorageKey);
  if (baToken) {
    headers["ba-token"] = baToken;
  }
  if (baUserToken) {
    headers["ba-user-token"] = baUserToken;
  }
  return headers;
}

// src/api/core/query.ts
function appendQueryParams(url, query) {
  if (!query) {
    return url;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null) {
          url.searchParams.append(key, String(item));
        }
      });
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url;
}

// src/lib/auth.ts
var AUTH_SESSION_STORAGE_KEY = "member_auth_session";
var AUTH_SESSION_CHANGE_EVENT = "member-auth-session-change";
function safeParse(value) {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed.isAuthenticated ? parsed : null;
  } catch {
    return null;
  }
}
function dispatchAuthSessionChange() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CHANGE_EVENT));
}
function removeSessionFromStorage(storage) {
  storage.removeItem(AUTH_SESSION_STORAGE_KEY);
  storage.removeItem(apiConfig.tokenStorageKey);
}
function getBrowserStorages() {
  if (typeof window === "undefined") {
    return null;
  }
  return {
    local: window.localStorage,
    session: window.sessionStorage
  };
}
function getAuthSessionSnapshot() {
  const storages = getBrowserStorages();
  if (!storages) {
    return null;
  }
  return safeParse(storages.session.getItem(AUTH_SESSION_STORAGE_KEY)) ?? safeParse(storages.local.getItem(AUTH_SESSION_STORAGE_KEY));
}
function clearAuthSession() {
  const storages = getBrowserStorages();
  if (!storages) {
    return;
  }
  removeSessionFromStorage(storages.local);
  removeSessionFromStorage(storages.session);
  dispatchAuthSessionChange();
}
function getAuthHeaders() {
  const session = getAuthSessionSnapshot();
  if (!session) {
    return {};
  }
  const headers = {};
  if (session.baToken) {
    headers["ba-token"] = session.baToken;
  }
  const userToken = session.baUserToken ?? session.accessToken;
  if (userToken) {
    headers["ba-user-token"] = userToken;
  }
  return headers;
}

// src/api/core/client.ts
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function trimLeadingSlash(value) {
  return value.startsWith("/") ? value.slice(1) : value;
}
function resolveUrl(path, baseURL) {
  if (/^https?:\/\//i.test(path)) {
    return new URL(path);
  }
  if (baseURL) {
    return new URL(trimLeadingSlash(path), ensureTrailingSlash(baseURL));
  }
  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, origin);
}
function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}
function isBodyInit(value) {
  return typeof value === "string" || value instanceof Blob || value instanceof FormData || value instanceof URLSearchParams || value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}
function hasJsonContentType(headers) {
  return headers.get("content-type")?.includes("application/json") ?? false;
}
function isEnvelope(payload) {
  return isPlainObject(payload) && "code" in payload && "data" in payload;
}
var responseListFieldKeys = /* @__PURE__ */ new Set([
  "list",
  "rows",
  "items",
  "menus",
  "children",
  "sessions",
  "packages",
  "zones",
  "package_zones",
  "session_options",
  "records",
  "resources",
  "hotNews",
  "hotVideos",
  "loginTabs",
  "cards",
  "collections",
  "consignments",
  "controllers",
  "columns",
  "databases",
  "ips",
  "related_users",
  "errors",
  "skus",
  "specs",
  "stages",
  "top_winners"
]);
function normalizeArrayField(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeListPayload(item));
  }
  if (isPlainObject(value)) {
    return Object.values(value).map((item) => normalizeListPayload(item));
  }
  return [];
}
function normalizeListPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeListPayload(item));
  }
  if (!isPlainObject(payload)) {
    return payload;
  }
  const normalized = payload;
  Object.keys(normalized).forEach((key) => {
    const value = normalized[key];
    if (responseListFieldKeys.has(key)) {
      normalized[key] = normalizeArrayField(value);
      return;
    }
    normalized[key] = normalizeListPayload(value);
  });
  return payload;
}
function buildMockKey(method, url) {
  return `${method} ${url.pathname}`;
}
function createAbortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}
function shouldRedirectToLogin(status, code) {
  return status === 303 || code === 303 || code === "303";
}
function getBizCode(payload) {
  return payload.biz_code ?? payload.code;
}
function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }
  clearAuthSession();
  if (window.location.hash === "#/login") {
    return;
  }
  window.location.hash = "#/login";
}
async function delay(duration, signal) {
  if (duration <= 0) {
    return;
  }
  await new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, duration);
    const handleAbort = () => {
      window.clearTimeout(timer);
      reject(createAbortError());
    };
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}
var HttpClient = class {
  constructor(options = {}) {
    this.options = {
      baseURL: options.baseURL,
      defaultHeaders: options.defaultHeaders ?? {},
      enableMock: options.enableMock ?? false,
      getAccessToken: options.getAccessToken,
      getAuthHeaders: options.getAuthHeaders,
      isSuccessCode: options.isSuccessCode ?? ((code) => code === 0),
      mockDelay: options.mockDelay ?? 0,
      mockHandlers: options.mockHandlers ?? {},
      timeout: options.timeout ?? 1e4
    };
  }
  async request(path, options = {}) {
    const method = options.method ?? "GET";
    const headers = new Headers(this.options.defaultHeaders);
    const url = appendQueryParams(resolveUrl(path, this.options.baseURL), options.query);
    const controller = new AbortController();
    const timeout = options.timeout ?? this.options.timeout;
    let timedOut = false;
    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }
    const authHeaders = this.options.getAuthHeaders?.();
    if (authHeaders) {
      new Headers(authHeaders).forEach((value, key) => {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      });
    }
    const token = this.options.getAccessToken?.();
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }
    const detachAbortBridge = this.bridgeAbortSignal(options.signal, controller);
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
    try {
      const preparedBody = this.prepareBody(options.body, headers);
      const enableMock = options.useMock ?? this.options.enableMock;
      if (enableMock) {
        const mockHandler = this.options.mockHandlers[buildMockKey(method, url)];
        if (mockHandler) {
          await delay(this.options.mockDelay, controller.signal);
          const payload2 = await mockHandler({
            body: options.body,
            headers,
            method,
            signal: controller.signal,
            url
          });
          return this.unwrapPayload(payload2, 200);
        }
      }
      const response = await fetch(url.toString(), {
        ...options,
        body: preparedBody,
        headers,
        method,
        signal: controller.signal
      });
      const payload = await this.parseResponse(response, options.responseType ?? "json");
      if (!response.ok) {
        throw this.toApiError(payload, response.status);
      }
      return this.unwrapPayload(payload, response.status);
    } catch (error) {
      if (timedOut) {
        throw new ApiError("Request timed out.", { code: "REQUEST_TIMEOUT" });
      }
      if (error instanceof ApiError || isAbortError(error)) {
        throw error;
      }
      throw new ApiError("Network request failed.", { details: error });
    } finally {
      window.clearTimeout(timeoutId);
      detachAbortBridge();
    }
  }
  get(path, options = {}) {
    return this.request(path, { ...options, method: "GET" });
  }
  post(path, body, options = {}) {
    return this.request(path, { ...options, body, method: "POST" });
  }
  put(path, body, options = {}) {
    return this.request(path, { ...options, body, method: "PUT" });
  }
  patch(path, body, options = {}) {
    return this.request(path, { ...options, body, method: "PATCH" });
  }
  delete(path, body, options = {}) {
    return this.request(path, { ...options, body, method: "DELETE" });
  }
  bridgeAbortSignal(signal, controller) {
    if (!signal) {
      return () => void 0;
    }
    if (signal.aborted) {
      controller.abort();
      return () => void 0;
    }
    const handleAbort = () => controller.abort();
    signal.addEventListener("abort", handleAbort, { once: true });
    return () => signal.removeEventListener("abort", handleAbort);
  }
  prepareBody(body, headers) {
    if (body == null) {
      return void 0;
    }
    if (isBodyInit(body)) {
      return body;
    }
    if (isPlainObject(body) || Array.isArray(body)) {
      if (!hasJsonContentType(headers)) {
        headers.set("content-type", "application/json");
      }
      return JSON.stringify(body);
    }
    return String(body);
  }
  async parseResponse(response, responseType) {
    if (responseType === "blob") {
      return response.blob();
    }
    if (responseType === "text") {
      return response.text();
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    const text = await response.text();
    if (!text) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  toApiError(payload, status) {
    if (isEnvelope(payload)) {
      if (shouldRedirectToLogin(status, getBizCode(payload))) {
        redirectToLogin();
      }
      return new ApiError(payload.message || payload.msg || "Request failed.", {
        code: getBizCode(payload),
        details: payload,
        status
      });
    }
    if (shouldRedirectToLogin(status)) {
      redirectToLogin();
    }
    if (isPlainObject(payload) && typeof payload.message === "string") {
      return new ApiError(payload.message, { details: payload, status });
    }
    return new ApiError("Request failed.", { details: payload, status });
  }
  unwrapPayload(payload, status) {
    if (isEnvelope(payload)) {
      if (!this.options.isSuccessCode(payload.code)) {
        if (shouldRedirectToLogin(status, getBizCode(payload))) {
          redirectToLogin();
        }
        throw new ApiError(payload.message || payload.msg || "Request failed.", {
          code: getBizCode(payload),
          details: payload,
          status
        });
      }
      return normalizeListPayload(payload.data);
    }
    return normalizeListPayload(payload);
  }
};

// src/api/mock/handlers.ts
var messagesByType = {
  system: [
    {
      id: "s1",
      title: "\u7CFB\u7EDF\u5347\u7EA7\u901A\u77E5",
      summary: "\u4ECA\u665A 02:00 \u81F3 04:00 \u5C06\u8FDB\u884C\u5347\u7EA7\u7EF4\u62A4\uFF0C\u90E8\u5206\u529F\u80FD\u77ED\u65F6\u4E0D\u53EF\u7528\u3002",
      time: "2026-03-05 10:00",
      isRead: false
    },
    {
      id: "s2",
      title: "\u5B9E\u540D\u8BA4\u8BC1\u5BA1\u6838\u901A\u8FC7",
      summary: "\u60A8\u7684\u5B9E\u540D\u8BA4\u8BC1\u4FE1\u606F\u5DF2\u5BA1\u6838\u901A\u8FC7\uFF0C\u5E73\u53F0\u6838\u5FC3\u529F\u80FD\u5DF2\u5F00\u653E\u3002",
      time: "2026-03-04 15:30",
      isRead: true
    }
  ],
  order: [
    {
      id: "o1",
      title: "\u8BA2\u5355\u5DF2\u53D1\u8D27",
      summary: "\u8BA2\u5355 1234567890 \u5DF2\u53D1\u8D27\uFF0C\u8BF7\u6CE8\u610F\u67E5\u6536\u3002",
      time: "2\u5C0F\u65F6\u524D",
      isRead: false
    },
    {
      id: "o2",
      title: "\u9000\u6B3E\u5904\u7406\u5B8C\u6210",
      summary: "\u8BA2\u5355 0987654321 \u7684\u9000\u6B3E\u5DF2\u539F\u8DEF\u9000\u56DE\uFF0C\u9884\u8BA1 1 \u81F3 3 \u4E2A\u5DE5\u4F5C\u65E5\u5230\u8D26\u3002",
      time: "\u6628\u5929 14:20",
      isRead: true
    }
  ],
  activity: [
    {
      id: "a1",
      title: "\u6625\u5B63\u9884\u552E\u5F00\u542F",
      summary: "\u5E74\u5EA6\u6625\u5B63\u6D3B\u52A8\u5DF2\u4E0A\u7EBF\uFF0C\u591A\u7C7B\u5546\u54C1\u9650\u65F6\u8865\u8D34\u3002",
      time: "2026-03-01 00:00",
      isRead: false
    }
  ]
};
var mockAuthUsers = [
  {
    id: "10001",
    mobile: "13800138000",
    password: "abc12345",
    payPassword: "pay12345",
    username: "demo"
  }
];
function asRecord(value) {
  return value && typeof value === "object" ? value : {};
}
function readValue(value) {
  return typeof value === "string" ? value.trim() : "";
}
function buildMockSession(user) {
  return {
    baToken: `mock-ba-token-${user.id}`,
    baUserToken: `mock-ba-user-token-${user.id}`,
    routePath: "/user",
    userInfo: {
      id: user.id,
      uid: user.id,
      username: user.username,
      nickname: `\u4F1A\u5458${user.mobile.slice(-4)}`,
      mobile: user.mobile
    }
  };
}
var mockHandlers = {
  "GET /api/Announcement/popup": () => ({
    code: 1,
    message: "ok",
    data: { list: [] }
  }),
  "GET /messages": ({ url }) => {
    const type = url.searchParams.get("type") ?? "system";
    return {
      code: 1,
      message: "ok",
      data: messagesByType[type] ?? []
    };
  },
  "GET /api/User/checkIn": () => ({
    code: 1,
    message: "ok",
    data: {
      userLoginCaptchaSwitch: false,
      accountVerificationType: [],
      loginTabs: ["login", "sms_login"],
      defaultTab: "login"
    }
  }),
  "POST /api/User/checkIn": ({ body }) => {
    const payload = asRecord(body);
    const tab = readValue(payload.tab);
    if (tab === "login") {
      const username = readValue(payload.username);
      const password = readValue(payload.password);
      if (!username || !password) {
        return {
          code: 0,
          message: "\u8BF7\u8F93\u5165\u7528\u6237\u540D\u548C\u5BC6\u7801",
          data: null
        };
      }
      const user = mockAuthUsers.find(
        (item) => item.username === username || item.mobile === username
      );
      if (!user) {
        return {
          code: 0,
          message: "\u5E10\u6237\u4E0D\u5B58\u5728",
          data: null
        };
      }
      if (user.password !== password) {
        return {
          code: 0,
          message: "\u5BC6\u7801\u9519\u8BEF",
          data: null
        };
      }
      return {
        code: 1,
        message: "\u767B\u5F55\u6210\u529F",
        data: buildMockSession(user)
      };
    }
    if (tab === "register") {
      const mobile = readValue(payload.mobile);
      const password = readValue(payload.password);
      const payPassword = readValue(payload.pay_password);
      const captcha = readValue(payload.captcha);
      if (!mobile || !password || !payPassword || !captcha) {
        return {
          code: 0,
          message: "\u8BF7\u5B8C\u6574\u586B\u5199\u6CE8\u518C\u4FE1\u606F",
          data: null
        };
      }
      const duplicated = mockAuthUsers.some(
        (item) => item.mobile === mobile || item.username === mobile
      );
      if (duplicated) {
        return {
          code: 0,
          message: "\u624B\u673A\u53F7\u5DF2\u6CE8\u518C",
          data: null
        };
      }
      const nextUser = {
        id: String(1e4 + mockAuthUsers.length + 1),
        mobile,
        password,
        payPassword,
        username: mobile
      };
      mockAuthUsers.push(nextUser);
      return {
        code: 1,
        message: "\u6CE8\u518C\u6210\u529F",
        data: buildMockSession(nextUser)
      };
    }
    if (tab === "sms_login") {
      const mobile = readValue(payload.mobile);
      const captcha = readValue(payload.captcha);
      if (!mobile || !captcha) {
        return {
          code: 0,
          message: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7\u548C\u9A8C\u8BC1\u7801",
          data: null
        };
      }
      const user = mockAuthUsers.find((item) => item.mobile === mobile);
      if (!user) {
        return {
          code: 0,
          message: "\u8BE5\u624B\u673A\u53F7\u672A\u6CE8\u518C",
          data: null
        };
      }
      return {
        code: 1,
        message: "\u767B\u5F55\u6210\u529F",
        data: buildMockSession(user)
      };
    }
    return {
      code: 0,
      message: "\u672A\u77E5\u64CD\u4F5C",
      data: null
    };
  },
  "POST /api/Sms/send": ({ body }) => {
    const payload = asRecord(body);
    const mobile = readValue(payload.mobile);
    const event = readValue(payload.event);
    if (!mobile) {
      return {
        code: 0,
        message: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7",
        data: null
      };
    }
    const user = mockAuthUsers.find((item) => item.mobile === mobile);
    if (!event) {
      return {
        code: 0,
        message: "\u7F3A\u5C11\u77ED\u4FE1\u4E8B\u4EF6\u7C7B\u578B",
        data: null
      };
    }
    if (event === "user_register" && user) {
      return {
        code: 0,
        message: "\u624B\u673A\u53F7\u5DF2\u6CE8\u518C\uFF0C\u8BF7\u76F4\u63A5\u767B\u5F55",
        data: null
      };
    }
    if (["user_retrieve_pwd", "user_mobile_verify", "user_login"].includes(event) && !user) {
      return {
        code: 0,
        message: "\u624B\u673A\u53F7\u672A\u6CE8\u518C",
        data: null
      };
    }
    return {
      code: 1,
      message: "\u53D1\u9001\u6210\u529F",
      data: null
    };
  },
  "GET /api/Account/checkOldAssetsUnlockStatus": () => ({
    code: 1,
    message: "ok",
    data: {
      unlock_status: 0,
      unlock_conditions: {
        has_transaction: false,
        transaction_count: 0,
        direct_referrals_count: 2,
        qualified_referrals: 1,
        is_qualified: false,
        messages: ["\u9700\u81F3\u5C11\u5B8C\u6210 1 \u7B14\u4EA4\u6613", "\u76F4\u63A8\u6709\u6548\u7528\u6237 1/2"]
      },
      required_gold: 1e3,
      current_gold: 4500,
      can_unlock: false,
      required_transactions: 1,
      required_referrals: 2,
      reward_value: 1e3
    }
  }),
  "GET /api/Account/growthRightsInfo": () => ({
    code: 1,
    message: "ok",
    data: {
      growth_days: 28,
      effective_trade_days: 28,
      today_trade_count: 3095,
      total_trade_count: 51259,
      pending_activation_gold: 11111,
      growth_start_date: "2026-02-12",
      stage: {
        key: "seedling",
        label: "\u521D\u7EA7\u9636\u6BB5",
        rights_status: "\u672A\u6FC0\u6D3B",
        min_days: 0
      },
      stages: [
        { key: "seedling", label: "\u521D\u7EA7\u9636\u6BB5", min_days: 0, max_days: 37, rights_status: "\u672A\u6FC0\u6D3B" },
        { key: "growing", label: "\u6210\u957F\u671F", min_days: 38, max_days: 44, rights_status: "\u53EF\u6FC0\u6D3B\u8F6C\u5411\u91D1" },
        { key: "mature", label: "\u6210\u719F\u671F", min_days: 45, max_days: 59, rights_status: "\u53EF\u89E3\u9501\u8D44\u4EA7\u5305" },
        { key: "advanced", label: "\u8FDB\u9636\u671F", min_days: 60, max_days: 89, rights_status: "\u914D\u8D44\u6BD4\u4F8B\u63D0\u5347" },
        { key: "senior", label: "\u9AD8\u7EA7\u9636\u6BB5", min_days: 90, max_days: null, rights_status: "\u4F18\u5316\u914D\u8D44\u6BD4\u4F8B" }
      ],
      status: {
        can_activate: false,
        can_unlock_package: false,
        financing_enabled: false,
        is_accelerated_mode: true
      },
      financing: {
        ratio: "--",
        rules: [
          { min_days: 38, max_days: 59, ratio: "9:1" },
          { min_days: 60, max_days: 89, ratio: "8:2" },
          { min_days: 90, max_days: 119, ratio: "7:3" },
          { min_days: 120, max_days: null, ratio: "6:4" }
        ]
      },
      cycle: {
        active_mode: "daily_three",
        cycle_days: 30,
        completed_cycles: 0,
        next_cycle_in_days: 2,
        remaining_days_in_cycle: 2,
        unlock_amount_per_cycle: 1e3,
        unlockable_amount: 0,
        mode_progress: {
          daily_once: {
            label: "\u6BCF\u65E5\u4EA4\u66131\u6B21\u6A21\u5F0F",
            growth_days: 28,
            required_days: 45,
            summary: { remaining_days_in_cycle: 17 }
          },
          daily_three: {
            label: "\u6BCF\u65E5\u4EA4\u66133\u6B21\u6A21\u5F0F",
            growth_days: 28,
            required_days: 30,
            summary: { remaining_days_in_cycle: 2 }
          }
        }
      },
      daily_growth_logs: [
        { date: "2026-03-08", trade_count: 3095, counted: true, reason: "\u5F53\u65E5\u5B8C\u6210 3095 \u7B14\u6709\u6548\u4EA4\u6613\uFF08\u95E8\u69DB\u22651\u7B14\uFF09\uFF0C\u8BA1\u5165\u6210\u957F 1 \u5929" },
        { date: "2026-03-07", trade_count: 1698, counted: true, reason: "\u5F53\u65E5\u5B8C\u6210 1698 \u7B14\u6709\u6548\u4EA4\u6613\uFF08\u95E8\u69DB\u22651\u7B14\uFF09\uFF0C\u8BA1\u5165\u6210\u957F 1 \u5929" },
        { date: "2026-02-22", trade_count: 0, counted: true, reason: "\u3010\u6210\u957F\u6D3B\u52A8\u3011\u6D3B\u52A8\u671F\u95F4\u989D\u5916\u8BA1\u5165\u6210\u957F 1 \u5929", is_activity_bonus: true },
        { date: "2026-02-17", trade_count: 0, counted: false, reason: "\u5F53\u65E5\u65E0\u6709\u6548\u4EA4\u6613\uFF0C\u672A\u8BA1\u5165\u6210\u957F" },
        { date: "2026-02-12", trade_count: 0, counted: false, reason: "\u8D77\u7B97\u65E5\u524D\uFF0C\u4E0D\u8BA1\u5165\u6210\u957F" }
      ]
    }
  }),
  "POST /api/Account/unlockOldAssets": () => ({
    code: 1,
    message: "\u89E3\u9501\u6210\u529F",
    data: {
      unlock_status: 1,
      consumed_gold: 1e3,
      reward_equity_package: 1e3,
      reward_consignment_coupon: 1
    }
  }),
  "GET /api/shopCart/count": () => ({
    code: 1,
    message: "ok",
    data: { count: 0 }
  }),
  "GET /api/shopCart/list": () => ({
    code: 1,
    message: "ok",
    data: { list: [] }
  }),
  "GET /api/shopAddress/index": () => ({
    code: 1,
    message: "ok",
    data: {
      list: [
        {
          id: 1,
          name: "\u5F20\u4E09",
          phone: "13800138000",
          province: "\u5E7F\u4E1C\u7701",
          city: "\u6DF1\u5733\u5E02",
          district: "\u5357\u5C71\u533A",
          address: "\u79D1\u6280\u56ED\u5357\u533A\u9AD8\u65B0\u5357\u4E5D\u905399\u53F7",
          is_default: "1",
          create_time: 1709884800,
          update_time: 1709884800
        },
        {
          id: 2,
          name: "\u674E\u56DB",
          phone: "13900139000",
          province: "\u5317\u4EAC\u5E02",
          city: "\u5317\u4EAC\u5E02",
          district: "\u671D\u9633\u533A",
          address: "\u5EFA\u56FD\u8DEF88\u53F7SOHO\u73B0\u4EE3\u57CE",
          is_default: "0",
          create_time: 17098e5,
          update_time: 17098e5
        }
      ]
    }
  }),
  "GET /api/shopAddress/getDefault": () => ({
    code: 1,
    message: "ok",
    data: {
      id: 1,
      name: "\u5F20\u4E09",
      phone: "13800138000",
      province: "\u5E7F\u4E1C\u7701",
      city: "\u6DF1\u5733\u5E02",
      district: "\u5357\u5C71\u533A",
      address: "\u79D1\u6280\u56ED\u5357\u533A\u9AD8\u65B0\u5357\u4E5D\u905399\u53F7",
      is_default: "1",
      create_time: 1709884800,
      update_time: 1709884800
    }
  }),
  "POST /api/shopAddress/add": (ctx) => {
    const body = ctx.body;
    const id = 100 + Math.floor(Math.random() * 900);
    return { code: 1, message: "\u6DFB\u52A0\u6210\u529F", data: { id } };
  },
  "POST /api/shopAddress/edit": () => ({
    code: 1,
    message: "\u4FEE\u6539\u6210\u529F",
    data: {}
  }),
  "POST /api/shopAddress/delete": () => ({
    code: 1,
    message: "\u5220\u9664\u6210\u529F",
    data: {}
  }),
  "POST /api/shopAddress/setDefault": () => ({
    code: 1,
    message: "\u8BBE\u7F6E\u6210\u529F",
    data: {}
  }),
  "POST /api/shopCart/add": (ctx) => {
    const body = ctx.body;
    const quantity = typeof body?.quantity === "number" && body.quantity > 0 ? body.quantity : 1;
    const id = typeof body?.product_id === "number" ? body.product_id * 1e3 + (body.sku_id ?? 0) : 1;
    return {
      code: 1,
      message: "ok",
      data: { id, quantity }
    };
  },
  "POST /api/shopOrder/create": (ctx) => {
    const body = ctx.body;
    const totalAmount = typeof body?.total_amount === "number" ? body.total_amount : 0;
    const orderId = 1e3 + Math.floor(Math.random() * 9999);
    const orderNo = `SO${Date.now().toString().slice(-10)}`;
    return {
      code: 1,
      message: "ok",
      data: { order_id: orderId, order_no: orderNo, total_amount: totalAmount }
    };
  },
  "GET /api/shopOrder/detail": ({ url }) => {
    const id = url.searchParams.get("id");
    return {
      code: 1,
      message: "ok",
      data: {
        id: id ? Number(id) : 0,
        balance_available: "12345.00",
        score: "500.00"
      }
    };
  },
  "POST /api/shopOrder/delete": (ctx) => {
    const body = ctx.body;
    const orderId = typeof body?.order_id === "number" ? body.order_id : 0;
    return {
      code: 1,
      message: "ok",
      data: { order_id: orderId }
    };
  },
  "POST /api/shopOrder/cancel": (ctx) => {
    const body = ctx.body;
    const orderId = typeof body?.order_id === "number" ? body.order_id : 0;
    return {
      code: 1,
      message: "ok",
      data: {
        order_no: `MOCK${orderId}`,
        order_id: orderId,
        status: "cancelled",
        need_review: false
      }
    };
  },
  "POST /api/shopOrder/confirm": (ctx) => {
    const body = ctx.body;
    const orderId = typeof body?.id === "number" ? body.id : 0;
    return {
      code: 1,
      message: "ok",
      data: { id: orderId }
    };
  },
  "GET /api/shopOrder/myOrders": ({ url }) => {
    const status = url.searchParams.get("status") ?? "";
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const list = [
      {
        order_id: 1001,
        order_no: "SO202603081001",
        status: status || "unpaid",
        total_amount: 7999,
        create_time: Date.now() / 1e3 - 3600,
        items: [
          {
            name: "Apple iPhone 15 Pro (A2849) 256GB \u84DD\u8272\u949B\u91D1\u5C5E",
            thumbnail: "/assets/placeholder.png",
            quantity: 1,
            price: 7999,
            spec_text: "\u989C\u8272\uFF1A\u84DD\u8272\u949B\u91D1\u5C5E / \u5BB9\u91CF\uFF1A256GB"
          }
        ]
      },
      {
        order_id: 1002,
        order_no: "SO202603081002",
        status: "pending_ship",
        total_amount: 299,
        create_time: Date.now() / 1e3 - 7200,
        items: [
          { name: "\u81EA\u8425\u7CBE\u9009\u5546\u54C1", thumbnail: "", quantity: 2, price: 149.5, spec_text: "" }
        ]
      }
    ].filter((o) => !status || o.status === status);
    const start = (page - 1) * limit;
    const pagedList = list.slice(start, start + limit);
    return {
      code: 1,
      message: "ok",
      data: {
        list: pagedList,
        balance_available: "12345.00",
        score: "500.00"
      }
    };
  }
};

// src/api/http.ts
var http = new HttpClient({
  baseURL: apiConfig.baseURL,
  defaultHeaders: {
    accept: "application/json"
  },
  enableMock: apiConfig.useMock,
  getAuthHeaders,
  isSuccessCode: (code) => code === 0 || code === 1 || code === 200 || code === "0" || code === "1" || code === "200",
  mockDelay: apiConfig.mockDelay,
  mockHandlers,
  timeout: apiConfig.timeout
});

// src/api/modules/address.ts
function readNumber(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}
function readString(v) {
  return typeof v === "string" ? v.trim() : "";
}
function readBool(v) {
  if (typeof v === "boolean") return v;
  return v === "1" || v === "true";
}
function buildRegion(p, c, d) {
  return [p, c, d].filter(Boolean).join(" ").trim();
}
function normalizeAddress(raw) {
  if (!raw || typeof raw !== "object") {
    return { id: 0, name: "", phone: "", region: "", detail: "", is_default: false };
  }
  const province = readString(raw.province);
  const city = readString(raw.city);
  const district = readString(raw.district);
  return {
    id: readNumber(raw.id),
    name: readString(raw.name),
    phone: readString(raw.phone),
    region: buildRegion(province, city, district),
    detail: readString(raw.address),
    is_default: readBool(raw.is_default)
  };
}
function parseRegion(region) {
  const parts = (region || "").trim().split(/\s+/).filter(Boolean);
  return {
    province: parts[0] ?? "",
    city: parts[1] ?? "",
    district: parts[2] ?? ""
  };
}
var addressApi = {
  /**
   * 获取地址列表
   * GET /api/shopAddress/index
   */
  async list(options = {}) {
    const data = await http.get("/api/shopAddress/index", {
      headers: createApiHeaders(options),
      signal: options.signal
    });
    const list = Array.isArray(data?.list) ? data.list : [];
    return list.map(normalizeAddress);
  },
  /**
   * 获取默认地址
   * GET /api/shopAddress/getDefault
   */
  async getDefault(options = {}) {
    const data = await http.get("/api/shopAddress/getDefault", {
      headers: createApiHeaders(options),
      signal: options.signal
    });
    if (!data || typeof data !== "object" || !("id" in data)) {
      return null;
    }
    const item = normalizeAddress(data);
    return item.id > 0 ? item : null;
  },
  /**
   * 添加地址
   * POST /api/shopAddress/add
   * region 可选，格式如 "广东省 深圳市 南山区"，会解析为 province/city/district
   */
  async add(payload, options = {}) {
    const { province, city, district } = payload.province != null || payload.region != null ? payload.province != null ? {
      province: payload.province ?? "",
      city: payload.city ?? "",
      district: payload.district ?? ""
    } : parseRegion(payload.region ?? "") : { province: "", city: "", district: "" };
    const address = payload.address?.trim() || payload.detail?.trim() || "";
    const data = await http.post(
      "/api/shopAddress/add",
      {
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        province,
        city,
        district,
        address,
        is_default: payload.is_default ? "1" : "0"
      },
      { headers: createApiHeaders(options), signal: options.signal }
    );
    return readNumber(data?.id);
  },
  /**
   * 编辑地址
   * POST /api/shopAddress/edit
   */
  async edit(payload, options = {}) {
    const { province, city, district } = payload.province != null || payload.region != null ? payload.province != null ? {
      province: payload.province ?? "",
      city: payload.city ?? "",
      district: payload.district ?? ""
    } : parseRegion(payload.region ?? "") : { province: "", city: "", district: "" };
    const address = payload.address?.trim() || payload.detail?.trim() || "";
    await http.post(
      "/api/shopAddress/edit",
      {
        id: payload.id,
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        province,
        city,
        district,
        address,
        is_default: payload.is_default ? "1" : "0"
      },
      { headers: createApiHeaders(options), signal: options.signal }
    );
  },
  /**
   * 删除地址
   * POST /api/shopAddress/delete
   */
  async delete(id, options = {}) {
    await http.post(
      "/api/shopAddress/delete",
      { id },
      { headers: createApiHeaders(options), signal: options.signal }
    );
  },
  /**
   * 设置默认地址
   * POST /api/shopAddress/setDefault
   */
  async setDefault(id, options = {}) {
    await http.post(
      "/api/shopAddress/setDefault",
      { id },
      { headers: createApiHeaders(options), signal: options.signal }
    );
  }
};

// src/api/modules/common.ts
function normalizeChatConfig(data) {
  return {
    channelId: String(data?.channel_id ?? "").trim(),
    chatUrl: String(data?.chat_url ?? "").trim(),
    backupUrl: String(data?.chat_backup_url ?? "").trim()
  };
}
var commonApi = {
  async getPage(params, signal) {
    return http.get("/api/Common/page", {
      headers: createApiHeaders(),
      query: params,
      signal,
      useMock: false
    });
  },
  async getChatConfig(signal) {
    const response = await http.get("/api/Common/chatConfig", {
      headers: createApiHeaders(),
      signal,
      useMock: false
    });
    return normalizeChatConfig(response);
  }
};

// src/api/modules/shopCart.ts
function normalizeListResponse(payload) {
  if (Array.isArray(payload)) {
    return { list: payload };
  }
  return {
    list: payload.list ?? []
  };
}
var shopCartApi = {
  /**
   * 获取购物车总件数
   * GET /api/shopCart/count
   * 请求头需携带 batoken（用户 Token）
   */
  count(signal) {
    return http.get("/api/shopCart/count", { signal });
  },
  /**
   * 获取购物车列表
   * GET /api/shopCart/list
   * 请求头需携带 ba-token、ba-user-token 或 batoken（用户 Token）
   * 后端可能返回 data: { list: [] } 或 data: []，此处统一为 { list: [] }
   */
  async list(signal) {
    const payload = await http.get(
      "/api/shopCart/list",
      { signal }
    );
    return normalizeListResponse(payload);
  },
  /**
   * 加入购物车
   * POST /api/shopCart/add
   * 请求体：product_id, quantity, sku_id?, source, flash_sale_product_id?
   */
  add(params, options) {
    return http.post("/api/shopCart/add", params, {
      signal: options?.signal
    });
  }
};

// src/api/modules/shopOrder.ts
function readNumber2(value) {
  const next = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(next) ? next : 0;
}
function readString2(value) {
  return typeof value === "string" ? value.trim() : "";
}
var shopOrderApi = {
  /**
   * 创建订单（结算）
   * POST /api/shopOrder/create
   * @param payload 创建订单参数
   */
  async create(payload, options = {}) {
    const body = {
      address_id: payload.address_id,
      ...payload.remark != null && { remark: payload.remark }
    };
    if (payload.items != null && payload.items.length > 0) {
      body.items = payload.items;
    } else if (payload.cart_ids != null) {
      body.cart_ids = payload.cart_ids;
    }
    const data = await http.post("/api/shopOrder/create", body, {
      headers: createApiHeaders(options),
      signal: options.signal
    });
    return {
      order_id: readNumber2(data?.order_id ?? 0),
      order_no: readString2(data?.order_no ?? ""),
      total_amount: readNumber2(data?.total_amount ?? 0),
      total_score: readNumber2(data?.total_score ?? 0),
      status: readString2(data?.status ?? ""),
      pay_type: readString2(data?.pay_type ?? ""),
      balance_available: readString2(data?.balance_available ?? "0"),
      score: readString2(data?.score ?? "0")
    };
  },
  /**
   * 待付款订单列表
   * GET /api/shopOrder/pendingPay
   * @param params 分页及支付方式筛选
   */
  pendingPay(params, signal) {
    const query = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...params?.pay_type && { pay_type: params.pay_type }
    };
    return http.get("/api/shopOrder/pendingPay", {
      query,
      signal
    });
  },
  /**
   * 订单详情
   * GET /api/shopOrder/detail
   * @param id 订单 ID
   */
  detail(id, signal) {
    return http.get("/api/shopOrder/detail", {
      query: { id },
      signal
    });
  },
  /**
   * 确认收货
   * POST /api/shopOrder/confirm
   * @param id 订单 ID
   */
  confirm(id, options = {}) {
    return http.post(
      "/api/shopOrder/confirm",
      { id },
      {
        headers: createApiHeaders(options),
        signal: options.signal
      }
    );
  },
  applyAfterSale(payload, options = {}) {
    return http.post("/api/shopOrder/applyAfterSale", payload, {
      headers: createApiHeaders(options),
      signal: options.signal
    });
  },
  cancelAfterSale(payload, options = {}) {
    return http.post(
      "/api/shopOrder/cancelAfterSale",
      payload,
      {
        headers: createApiHeaders(options),
        signal: options.signal
      }
    );
  },
  receiveAfterSale(payload, options = {}) {
    return http.post(
      "/api/shopOrder/receiveAfterSale",
      payload,
      {
        headers: createApiHeaders(options),
        signal: options.signal
      }
    );
  },
  /**
   * 待发货订单列表
   * GET /api/shopOrder/pendingShip
   * @param params 分页与支付方式筛选
   */
  pendingShip(params, signal) {
    const query = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...params?.pay_type && { pay_type: params.pay_type }
    };
    return http.get("/api/shopOrder/pendingShip", {
      query,
      signal
    });
  },
  /**
   * 待确认收货订单列表
   * GET /api/shopOrder/pendingConfirm
   * @param params 分页与支付方式筛选
   */
  pendingConfirm(params, signal) {
    const query = {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...params?.pay_type && { pay_type: params.pay_type }
    };
    return http.get("/api/shopOrder/pendingConfirm", {
      query,
      signal
    });
  },
  /**
   * 商城订单支付
   * POST /api/shopOrder/pay
   * @param payload 支付参数
   */
  async pay(payload, options = {}) {
    const body = {
      order_id: payload.order_id,
      pay_money: payload.pay_money ?? 0,
      pay_score: payload.pay_score ?? 0
    };
    const data = await http.post(
      "/api/shopOrder/pay",
      body,
      {
        headers: createApiHeaders(options),
        signal: options.signal
      }
    );
    return {
      order_no: readString2(data?.order_no),
      order_id: readNumber2(data?.order_id),
      status: readString2(data?.status),
      pay_money: readNumber2(data?.pay_money),
      pay_score: readNumber2(data?.pay_score)
    };
  },
  /**
   * 我的订单列表（商城订单）
   * GET /api/shopOrder/myOrders
   * 请求头需携带 batoken（用户 Token）
   */
  myOrders(query = {}, signal) {
    return http.get("/api/shopOrder/myOrders", {
      query,
      signal
    });
  },
  /**
   * 已完成订单列表
   * GET /api/shopOrder/completed
   * @param params 分页与支付方式筛选
   */
  completed(params = {}, signal) {
    return http.get("/api/shopOrder/completed", {
      query: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        ...params.pay_type && { pay_type: params.pay_type }
      },
      signal
    });
  },
  /**
   * 取消订单（商城订单取消）
   * POST /api/shopOrder/cancel
   * 请求头需携带 batoken（用户 Token）
   * cancel_reason 超过24小时必填
   */
  cancel(payload, signal) {
    return http.post(
      "/api/shopOrder/cancel",
      payload,
      { signal }
    );
  },
  /**
   * 删除待支付订单
   * POST /api/shopOrder/delete
   * @param orderId 订单 ID
   */
  async delete(orderId, options = {}) {
    const data = await http.post(
      "/api/shopOrder/delete",
      { order_id: orderId },
      {
        headers: createApiHeaders(options),
        signal: options.signal
      }
    );
    return {
      order_id: readNumber2(data?.order_id ?? orderId)
    };
  }
};

// src/api/modules/shopProduct.ts
var shopProductApi = {
  categories(signal) {
    return http.get("/api/shopProduct/categories", { signal });
  },
  detail(id, signal) {
    return http.get("/api/shopProduct/detail", {
      query: { id },
      signal
    });
  },
  latest(query = {}, signal) {
    return http.get("/api/shopProduct/latest", {
      query,
      signal
    });
  },
  list(query = {}, signal) {
    return http.get("/api/shopProduct/index", {
      query,
      signal
    });
  },
  reviews(query, signal) {
    return http.get("/api/shopProduct/reviews", {
      query,
      signal
    });
  },
  reviewSummary(productId, signal) {
    return http.get("/api/shopProduct/reviewSummary", {
      query: { product_id: productId },
      signal
    });
  },
  sales(query = {}, signal) {
    return http.get("/api/shopProduct/sales", {
      query,
      signal
    });
  },
  submitReview(payload, signal) {
    return http.post(
      "/api/shopProduct/submitReview",
      payload,
      { signal }
    );
  }
};

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var import_react2 = __toESM(require_react());

// node_modules/lucide-react/dist/esm/shared/src/utils.js
var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
var toCamelCase = (string) => string.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase()
);
var toPascalCase = (string) => {
  const camelCase = toCamelCase(string);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
};
var mergeClasses = (...classes) => classes.filter((className, index, array) => {
  return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index;
}).join(" ").trim();
var hasA11yProp = (props) => {
  for (const prop in props) {
    if (prop.startsWith("aria-") || prop === "role" || prop === "title") {
      return true;
    }
  }
};

// node_modules/lucide-react/dist/esm/Icon.js
var import_react = __toESM(require_react());

// node_modules/lucide-react/dist/esm/defaultAttributes.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};

// node_modules/lucide-react/dist/esm/Icon.js
var Icon = (0, import_react.forwardRef)(
  ({
    color = "currentColor",
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth,
    className = "",
    children,
    iconNode,
    ...rest
  }, ref) => (0, import_react.createElement)(
    "svg",
    {
      ref,
      ...defaultAttributes,
      width: size,
      height: size,
      stroke: color,
      strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
      className: mergeClasses("lucide", className),
      ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
      ...rest
    },
    [
      ...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)),
      ...Array.isArray(children) ? children : [children]
    ]
  )
);

// node_modules/lucide-react/dist/esm/createLucideIcon.js
var createLucideIcon = (iconName, iconNode) => {
  const Component2 = (0, import_react2.forwardRef)(
    ({ className, ...props }, ref) => (0, import_react2.createElement)(Icon, {
      ref,
      iconNode,
      className: mergeClasses(
        `lucide-${toKebabCase(toPascalCase(iconName))}`,
        `lucide-${iconName}`,
        className
      ),
      ...props
    })
  );
  Component2.displayName = toPascalCase(iconName);
  return Component2;
};

// node_modules/lucide-react/dist/esm/icons/chevron-left.js
var __iconNode = [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]];
var ChevronLeft = createLucideIcon("chevron-left", __iconNode);

// node_modules/lucide-react/dist/esm/icons/chevron-right.js
var __iconNode2 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]];
var ChevronRight = createLucideIcon("chevron-right", __iconNode2);

// node_modules/lucide-react/dist/esm/icons/circle-alert.js
var __iconNode3 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
  ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }]
];
var CircleAlert = createLucideIcon("circle-alert", __iconNode3);

// node_modules/lucide-react/dist/esm/icons/ellipsis.js
var __iconNode4 = [
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  ["circle", { cx: "19", cy: "12", r: "1", key: "1wjl8i" }],
  ["circle", { cx: "5", cy: "12", r: "1", key: "1pcz8c" }]
];
var Ellipsis = createLucideIcon("ellipsis", __iconNode4);

// node_modules/lucide-react/dist/esm/icons/map-pin.js
var __iconNode5 = [
  [
    "path",
    {
      d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
      key: "1r0f0z"
    }
  ],
  ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
];
var MapPin = createLucideIcon("map-pin", __iconNode5);

// node_modules/lucide-react/dist/esm/icons/message-circle.js
var __iconNode6 = [
  [
    "path",
    {
      d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
      key: "1sd12s"
    }
  ]
];
var MessageCircle = createLucideIcon("message-circle", __iconNode6);

// node_modules/lucide-react/dist/esm/icons/minus.js
var __iconNode7 = [["path", { d: "M5 12h14", key: "1ays0h" }]];
var Minus = createLucideIcon("minus", __iconNode7);

// node_modules/lucide-react/dist/esm/icons/package.js
var __iconNode8 = [
  [
    "path",
    {
      d: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z",
      key: "1a0edw"
    }
  ],
  ["path", { d: "M12 22V12", key: "d0xqtd" }],
  ["polyline", { points: "3.29 7 12 12 20.71 7", key: "ousv84" }],
  ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }]
];
var Package = createLucideIcon("package", __iconNode8);

// node_modules/lucide-react/dist/esm/icons/plus.js
var __iconNode9 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
];
var Plus = createLucideIcon("plus", __iconNode9);

// node_modules/lucide-react/dist/esm/icons/refresh-ccw.js
var __iconNode10 = [
  ["path", { d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "14sxne" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16", key: "1hlbsb" }],
  ["path", { d: "M16 16h5v5", key: "ccwih5" }]
];
var RefreshCcw = createLucideIcon("refresh-ccw", __iconNode10);

// node_modules/lucide-react/dist/esm/icons/rotate-ccw.js
var __iconNode11 = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }]
];
var RotateCcw = createLucideIcon("rotate-ccw", __iconNode11);

// node_modules/lucide-react/dist/esm/icons/share.js
var __iconNode12 = [
  ["path", { d: "M12 2v13", key: "1km8f5" }],
  ["path", { d: "m16 6-4-4-4 4", key: "13yo43" }],
  ["path", { d: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8", key: "1b2hhj" }]
];
var Share = createLucideIcon("share", __iconNode12);

// node_modules/lucide-react/dist/esm/icons/shield-check.js
var __iconNode13 = [
  [
    "path",
    {
      d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
      key: "oel41y"
    }
  ],
  ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }]
];
var ShieldCheck = createLucideIcon("shield-check", __iconNode13);

// node_modules/lucide-react/dist/esm/icons/shopping-cart.js
var __iconNode14 = [
  ["circle", { cx: "8", cy: "21", r: "1", key: "jimo8o" }],
  ["circle", { cx: "19", cy: "21", r: "1", key: "13723u" }],
  [
    "path",
    {
      d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",
      key: "9zh506"
    }
  ]
];
var ShoppingCart = createLucideIcon("shopping-cart", __iconNode14);

// node_modules/lucide-react/dist/esm/icons/star.js
var __iconNode15 = [
  [
    "path",
    {
      d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
      key: "r04s7s"
    }
  ]
];
var Star = createLucideIcon("star", __iconNode15);

// node_modules/lucide-react/dist/esm/icons/store.js
var __iconNode16 = [
  ["path", { d: "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5", key: "slp6dd" }],
  [
    "path",
    {
      d: "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",
      key: "o0xfot"
    }
  ],
  ["path", { d: "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05", key: "wn3emo" }]
];
var Store = createLucideIcon("store", __iconNode16);

// node_modules/lucide-react/dist/esm/icons/truck.js
var __iconNode17 = [
  ["path", { d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2", key: "wrbu53" }],
  ["path", { d: "M15 18H9", key: "1lyqi6" }],
  [
    "path",
    {
      d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
      key: "lysw3i"
    }
  ],
  ["circle", { cx: "17", cy: "18", r: "2", key: "332jqn" }],
  ["circle", { cx: "7", cy: "18", r: "2", key: "19iecd" }]
];
var Truck = createLucideIcon("truck", __iconNode17);

// node_modules/lucide-react/dist/esm/icons/wifi-off.js
var __iconNode18 = [
  ["path", { d: "M12 20h.01", key: "zekei9" }],
  ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }],
  ["path", { d: "M5 12.859a10 10 0 0 1 5.17-2.69", key: "1dl1wf" }],
  ["path", { d: "M19 12.859a10 10 0 0 0-2.007-1.523", key: "4k23kn" }],
  ["path", { d: "M2 8.82a15 15 0 0 1 4.177-2.643", key: "1grhjp" }],
  ["path", { d: "M22 8.82a15 15 0 0 0-11.288-3.764", key: "z3jwby" }],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }]
];
var WifiOff = createLucideIcon("wifi-off", __iconNode18);

// node_modules/lucide-react/dist/esm/icons/x.js
var __iconNode19 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
var X = createLucideIcon("x", __iconNode19);

// src/components/layout/OfflineBanner.tsx
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var OfflineBanner = ({
  message = "\u7F51\u7EDC\u4E0D\u7A33\u5B9A\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8BBE\u7F6E",
  actionLabel = "\u5237\u65B0",
  onAction,
  className = "",
  center = false,
  actionClassName = ""
}) => {
  const layoutClassName = onAction ? "justify-between" : center ? "justify-center" : "justify-start";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      className: `flex items-center gap-2 bg-red-50 px-4 py-2 text-sm text-primary-start ${layoutClassName} ${className}`.trim(),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "flex min-w-0 items-center", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WifiOff, { size: 14, className: "mr-2 shrink-0" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: message })
        ] }),
        onAction && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            type: "button",
            onClick: onAction,
            className: `rounded bg-white px-2 py-1 font-medium shadow-sm dark:bg-gray-900 ${actionClassName}`.trim(),
            children: actionLabel
          }
        )
      ]
    }
  );
};

// src/components/ui/FeedbackProvider.tsx
var import_react3 = __toESM(require_react(), 1);
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var FeedbackContext = (0, import_react3.createContext)(null);
var useFeedback = () => {
  const context = (0, import_react3.useContext)(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
};

// src/components/ui/ErrorState.tsx
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var ErrorState = ({
  message = "\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
  onRetry,
  retryText = "\u91CD\u65B0\u52A0\u8F7D",
  icon
}) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "flex flex-col items-center justify-center pt-32 px-4", children: [
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 text-primary-start", children: icon || /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CircleAlert, { size: 48 }) }),
  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "text-lg text-text-sub mb-6", children: message }),
  onRetry && /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
    "button",
    {
      onClick: onRetry,
      className: "px-6 py-2 rounded-full bg-primary-start text-white text-md font-medium active:opacity-80 shadow-sm",
      children: retryText
    }
  )
] });

// src/features/product-detail/components/ProductDetailHeader.tsx
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var ProductDetailHeader = ({
  isScrolled,
  onBack,
  title
}) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
  "div",
  {
    className: `fixed left-0 right-0 top-0 z-40 transition-colors duration-300 ${isScrolled ? "bg-white shadow-sm dark:bg-gray-900" : "bg-transparent"}`,
    children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex h-12 items-center justify-between px-4 pt-safe", children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "button",
        {
          onClick: onBack,
          className: `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isScrolled ? "text-text-main" : "bg-black/30 text-white"}`,
          children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ChevronLeft, { size: 20 })
        }
      ),
      isScrolled && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "animate-in fade-in flex flex-1 items-center justify-center px-6 text-center text-md font-medium text-text-main", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: "line-clamp-1", children: title || "\u5546\u54C1\u8BE6\u60C5" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: "flex space-x-3", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            className: `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isScrolled ? "text-text-main" : "bg-black/30 text-white"}`,
            children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Share, { size: 18 })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "button",
          {
            className: `flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isScrolled ? "text-text-main" : "bg-black/30 text-white"}`,
            children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Ellipsis, { size: 18 })
          }
        )
      ] })
    ] })
  }
);

// src/components/ui/Button.tsx
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var Button = ({
  children,
  variant = "primary",
  className = "",
  fullWidth = true,
  ...props
}) => {
  const baseStyle = "h-[48px] rounded-2xl font-medium text-lg flex items-center justify-center transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-gradient-to-r from-primary-start to-primary-end text-white shadow-soft",
    secondary: "bg-bg-card text-text-main border border-border-light shadow-soft",
    outline: "bg-transparent border border-primary-start text-primary-start",
    ghost: "bg-transparent text-text-sub"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "button",
    {
      className: `${baseStyle} ${fullWidth ? "w-full" : ""} ${variants[variant]} ${className}`.trim(),
      ...props,
      children
    }
  );
};

// src/features/product-detail/components/ProductAddressFormSheet.tsx
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var ProductAddressFormSheet = ({
  errors,
  isOpen,
  isSaving,
  onChange,
  onClose,
  onOpenRegionPicker,
  onSubmit,
  value
}) => {
  if (!isOpen) {
    return null;
  }
  const isFormValid = value.name.trim() && /^1[3-9]\d{9}$/.test(value.phone.trim()) && value.region.trim() && value.detail.trim();
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "fixed inset-0 z-[70] flex items-end", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "aria-label": "\u5173\u95ED\u65B0\u589E\u5730\u5740", className: "absolute inset-0 bg-black/50", onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "relative z-10 w-full rounded-t-[24px] bg-white dark:bg-gray-900", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
        "button",
        {
          type: "button",
          onClick: onClose,
          className: "absolute right-4 top-4 rounded-full p-1 text-text-sub active:bg-bg-base",
          children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(X, { size: 20 })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "border-b border-border-light px-4 py-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-lg font-semibold text-text-main", children: "\u65B0\u589E\u6536\u8D27\u5730\u5740" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mt-1 text-sm text-text-sub", children: "\u4E0B\u5355\u524D\u5148\u8865\u5145\u6536\u8D27\u4FE1\u606F" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "space-y-4 px-4 py-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mb-2 text-sm font-medium text-text-main", children: "\u6536\u8D27\u4EBA" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "input",
            {
              type: "text",
              placeholder: "\u540D\u5B57",
              value: value.name,
              onChange: (e) => onChange({ name: e.target.value }),
              className: "h-11 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-base text-text-main outline-none placeholder:text-text-aux"
            }
          ),
          errors.name ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mt-1 text-xs text-primary-start", children: errors.name }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mb-2 text-sm font-medium text-text-main", children: "\u624B\u673A\u53F7\u7801" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "input",
            {
              type: "tel",
              placeholder: "\u624B\u673A\u53F7",
              maxLength: 11,
              value: value.phone,
              onChange: (e) => onChange({ phone: e.target.value.replace(/\D/g, "") }),
              className: "h-11 w-full rounded-2xl border border-border-light bg-bg-base px-4 text-base text-text-main outline-none placeholder:text-text-aux"
            }
          ),
          errors.phone ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mt-1 text-xs text-primary-start", children: errors.phone }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mb-2 text-sm font-medium text-text-main", children: "\u6240\u5728\u5730\u533A" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "button",
            {
              type: "button",
              onClick: onOpenRegionPicker,
              className: "flex h-11 w-full items-center rounded-2xl border border-border-light bg-bg-base px-4 text-left",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: `flex-1 text-base ${value.region ? "text-text-main" : "text-text-aux"}`, children: value.region || "\u8BF7\u9009\u62E9\u7701 / \u5E02 / \u533A" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ChevronRight, { size: 18, className: "text-text-aux" })
              ]
            }
          ),
          errors.region ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mt-1 text-xs text-primary-start", children: errors.region }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mb-2 text-sm font-medium text-text-main", children: "\u8BE6\u7EC6\u5730\u5740" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
            "textarea",
            {
              placeholder: "\u5C0F\u533A\u697C\u680B / \u95E8\u724C\u53F7",
              value: value.detail,
              onChange: (e) => onChange({ detail: e.target.value }),
              className: "h-20 w-full resize-none rounded-2xl border border-border-light bg-bg-base px-4 py-3 text-base text-text-main outline-none placeholder:text-text-aux"
            }
          ),
          errors.detail ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mt-1 text-xs text-primary-start", children: errors.detail }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "button",
          {
            type: "button",
            onClick: () => onChange({ isDefault: !value.isDefault }),
            className: "flex w-full items-center justify-between rounded-2xl border border-border-light bg-bg-base px-4 py-3",
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "text-sm font-medium text-text-main", children: "\u8BBE\u4E3A\u9ED8\u8BA4\u5730\u5740" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "mt-1 text-xs text-text-sub", children: "\u540E\u7EED\u4E0B\u5355\u81EA\u52A8\u5E26\u51FA" })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "div",
                {
                  className: `relative h-6 w-12 rounded-full transition-colors ${value.isDefault ? "bg-primary-start" : "bg-gray-200 dark:bg-gray-800"}`,
                  children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "div",
                    {
                      className: `absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform dark:bg-gray-900 ${value.isDefault ? "left-[26px]" : "left-0.5"}`
                    }
                  )
                }
              )
            ]
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "border-t border-border-light bg-white p-4 pb-safe dark:bg-gray-900", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Button, { className: "w-full rounded-full", disabled: !isFormValid || isSaving, onClick: onSubmit, children: isSaving ? "\u4FDD\u5B58\u4E2D..." : "\u4FDD\u5B58\u5E76\u4F7F\u7528" }) })
    ] })
  ] });
};

// src/components/ui/Badge.tsx
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var Badge = ({
  children,
  variant = "default",
  className = ""
}) => {
  const variants = {
    default: "bg-bg-base text-text-sub border border-border-light",
    primary: "bg-red-50 text-primary-start border border-red-100",
    score: "bg-amber-500 text-white font-medium",
    solid: "bg-gradient-to-r from-primary-start to-primary-end text-white"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `text-xs px-1.5 py-0.5 rounded flex items-center ${variants[variant]} ${className}`, children });
};

// src/components/ui/Card.tsx
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var Card = ({ children, className = "", ...rest }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: `bg-bg-card rounded-2xl p-4 shadow-soft ${className}`, ...rest, children });
};

// src/components/ui/Skeleton.tsx
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var Skeleton = ({ className = "" }) => {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: `animate-pulse bg-border-light rounded-lg ${className}` });
};

// src/features/shop-product/utils.ts
function toFiniteNumber(value) {
  return Number.isFinite(value) ? Number(value) : 0;
}
function formatDecimalAmount(value) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    useGrouping: false
  }).format(value);
}
function formatIntegerAmount(value) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
    useGrouping: false
  }).format(value);
}
function withApiBase(pathname) {
  const base = apiConfig.baseURL || window.location.origin;
  return new URL(pathname.replace(/^\/+/, ""), `${base}/`).toString();
}
function readStringList(source) {
  if (!Array.isArray(source)) {
    return [];
  }
  return source.map((item) => {
    if (typeof item === "string") {
      return item.trim();
    }
    if (item && typeof item === "object" && "value" in item) {
      const value = item.value;
      return typeof value === "string" ? value.trim() : "";
    }
    return "";
  }).filter(Boolean);
}
function splitSpecValueNames(value) {
  if (typeof value !== "string") {
    return [];
  }
  return value.split("/").map((item) => item.trim()).filter(Boolean);
}
function readSkuSpecValues(sku) {
  const directValues = readStringList(sku.spec_values);
  if (directValues.length > 0) {
    return directValues;
  }
  return splitSpecValueNames(sku.spec_value_names);
}
function buildShopProductPath(id) {
  return `/product/${id}`;
}
function buildShopProductReviewsPath(id) {
  return `/product/${id}/reviews`;
}
function buildShopProductQaPath(id) {
  return `/product/${id}/qa`;
}
function resolveShopProductImageUrl(url) {
  const nextUrl = typeof url === "string" ? url.trim() : "";
  if (!nextUrl) {
    return "";
  }
  if (/^https?:\/\//i.test(nextUrl)) {
    return nextUrl;
  }
  return withApiBase(nextUrl);
}
function getShopProductPrimaryPrice(product) {
  const price = toFiniteNumber(product.price);
  const greenPowerAmount = toFiniteNumber(product.green_power_amount);
  const balanceAvailableAmount = toFiniteNumber(product.balance_available_amount);
  const scorePrice = toFiniteNumber(product.score_price);
  if (product.purchase_type === "both" && price > 0 && scorePrice > 0) {
    return `\xA5${formatDecimalAmount(price)} + ${formatIntegerAmount(scorePrice)}`;
  }
  if (product.purchase_type === "both" && price > 0) {
    return `\xA5${formatDecimalAmount(price)}`;
  }
  if (product.purchase_type === "both" && scorePrice > 0) {
    return formatIntegerAmount(scorePrice);
  }
  if (product.purchase_type === "score" && scorePrice > 0) {
    return formatIntegerAmount(scorePrice);
  }
  if (price > 0) {
    return `\xA5${formatDecimalAmount(price)}`;
  }
  if (greenPowerAmount > 0) {
    return `\u7EFF\u8272\u7B97\u529B ${formatDecimalAmount(greenPowerAmount)}`;
  }
  if (balanceAvailableAmount > 0) {
    return `\u4F59\u989D ${formatDecimalAmount(balanceAvailableAmount)}`;
  }
  if (scorePrice > 0) {
    return formatIntegerAmount(scorePrice);
  }
  if (product.purchase_type === "score") {
    return "\u5F85\u5B9A";
  }
  return "\u4EF7\u683C\u5F85\u5B9A";
}
function getShopProductPurchaseTag(product) {
  if (product.purchase_type === "score") {
    return "\u6D88\u8D39\u91D1";
  }
  if (product.purchase_type === "both") {
    return "\u6DF7\u5408\u652F\u4ED8";
  }
  return "\u73B0\u91D1\u8D2D\u4E70";
}
function getShopProductBadges(product) {
  const tag = getShopProductPurchaseTag(product);
  return tag ? [tag] : [];
}
function buildShopProductOptionGroups(product) {
  if (!product?.sku_specs?.length) {
    return [];
  }
  return product.sku_specs.reduce((groups, item) => {
    const name = item.name?.trim();
    const options = [
      ...readStringList(item.options),
      ...readStringList(item.values)
    ].filter((option, index, source) => source.indexOf(option) === index);
    if (!name || !options.length) {
      return groups;
    }
    groups.push({
      name,
      options
    });
    return groups;
  }, []);
}
function buildShopProductSelectedSummary(optionGroups, selectedOptions, quantity) {
  const summary = optionGroups.map((group) => selectedOptions[group.name]).filter(Boolean);
  summary.push(`x${quantity}`);
  return summary.join(" / ");
}
function getSelectedSkuId(product, optionGroups, selectedOptions) {
  if (!product?.skus?.length || !optionGroups.length) {
    return void 0;
  }
  const selectedValues = optionGroups.map((g) => selectedOptions[g.name]?.trim()).filter(Boolean);
  if (selectedValues.length !== optionGroups.length) {
    return void 0;
  }
  const sku = product.skus.find((s) => {
    const specValues = readSkuSpecValues(s);
    if (specValues.length !== selectedValues.length) return false;
    return selectedValues.every((v, i) => specValues[i] === v);
  });
  return sku?.id != null && Number.isFinite(sku.id) ? sku.id : void 0;
}
function buildShopProductDescription(product) {
  const description = product?.description?.trim();
  if (description) {
    return description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return "";
}
function buildShopProductSpecs(product) {
  return (product?.specs ?? []).filter((item) => item.name?.trim() && item.value?.trim());
}
function buildShopProductServiceItems(product) {
  const items = [];
  if (product?.delivery_info?.free_shipping) {
    items.push("\u5305\u90AE");
  }
  if (product?.delivery_info?.delivery_time) {
    items.push(product.delivery_info.delivery_time);
  }
  if (product?.delivery_info?.support_same_day) {
    items.push("\u652F\u6301\u5F53\u65E5\u8FBE");
  }
  if (product?.after_sale?.return_policy) {
    items.push(product.after_sale.return_policy);
  }
  if (product?.after_sale?.exchange_policy) {
    items.push(product.after_sale.exchange_policy);
  }
  if (product?.after_sale?.warranty) {
    items.push(product.after_sale.warranty);
  }
  if (!items.length) {
    items.push("\u5E73\u53F0\u53D1\u8D27");
    items.push("\u552E\u540E\u4FDD\u969C");
  }
  return items;
}
function getShopProductReviewUser(review) {
  return review.user?.trim() || "\u533F\u540D\u7528\u6237";
}
function getShopProductReviewImages(review) {
  return (review.images ?? []).map((image) => resolveShopProductImageUrl(image)).filter(Boolean);
}

// src/features/product-detail/components/ProductOverviewSection.tsx
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
var ProductOverviewSection = ({
  loading,
  onOpenServiceDescription,
  onOpenSku,
  product,
  quantity,
  selectedSummary
}) => {
  const gallery = product ? [product.thumbnail, ...product.images ?? []].map((image) => resolveShopProductImageUrl(image)).filter(Boolean).filter((image, index, source) => source.indexOf(image) === index) : [];
  const serviceItems = buildShopProductServiceItems(product);
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
    loading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "aspect-square w-full" }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "relative aspect-square w-full bg-white dark:bg-gray-900", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
        "img",
        {
          src: gallery[0],
          alt: product?.name || "\u5546\u54C1",
          className: "h-full w-full object-cover",
          referrerPolicy: "no-referrer"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "absolute bottom-4 right-4 rounded-full bg-black/40 px-2 py-1 text-s text-white backdrop-blur-sm", children: [
        "1 / ",
        gallery.length || 1
      ] })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { className: "m-4 space-y-3 p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-8 w-40" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-full" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-2/3" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { className: "mx-4 mt-4 rounded-t-[16px] rounded-b-none border-b border-border-light p-4 shadow-none", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "mb-2 flex items-end justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "text-2xl font-bold leading-tight text-primary-start", children: product ? getShopProductPrimaryPrice(product) : "\u4EF7\u683C\u5F85\u5B9A" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "text-sm text-text-sub", children: [
          "\u5E93\u5B58 ",
          product?.stock ?? 0
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "mb-3 flex flex-wrap gap-1.5", children: [
        (product ? getShopProductBadges(product) : []).map((badge) => /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Badge, { variant: badge === "\u6D88\u8D39\u91D1" ? "score" : "primary", children: badge }, badge)),
        product?.category && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Badge, { variant: "default", className: "rounded-full", children: product.category })
      ] })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { className: "mx-4 mb-4 space-y-2 rounded-t-none p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-5 w-full" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-5 w-3/4" }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "mt-2 h-4 w-1/2" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { className: "mx-4 mb-4 rounded-t-none p-4 shadow-soft", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("h1", { className: "mb-2 line-clamp-2 text-xl font-bold leading-snug text-text-main", children: product?.name || "\u5546\u54C1\u8BE6\u60C5" }),
      buildShopProductDescription(product) && /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { className: "mb-3 text-base text-text-sub", children: buildShopProductDescription(product) }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center space-x-4 text-s text-text-aux", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
          "\u9500\u91CF ",
          product?.sales ?? 0
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { children: [
          "\u5E93\u5B58 ",
          product?.stock ?? 0
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { children: product?.is_physical === "1" ? "\u5B9E\u7269\u5546\u54C1" : "\u865A\u62DF\u5546\u54C1" })
      ] })
    ] }),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { className: "m-4 flex items-center justify-between p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex w-full items-center space-x-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-8" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-48" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-4" })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
      Card,
      {
        className: "m-4 flex cursor-pointer items-center justify-between p-4 transition-colors active:bg-bg-base",
        onClick: () => onOpenSku("select"),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "w-12 shrink-0 text-base font-bold text-text-main", children: "\u5DF2\u9009" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "line-clamp-1 text-base text-text-main", children: selectedSummary || `x${quantity}` })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ChevronRight, { size: 16, className: "shrink-0 text-text-aux" })
        ]
      }
    ),
    loading ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(Card, { className: "m-4 space-y-4 p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-8" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-full" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-8" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Skeleton, { className: "h-4 w-full" })
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
      Card,
      {
        className: "m-4 cursor-pointer p-4 transition-colors active:bg-bg-base",
        onClick: onOpenServiceDescription,
        children: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { className: "flex items-start", children: [
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "mt-0.5 w-12 shrink-0 text-base font-bold text-text-main", children: "\u670D\u52A1" }),
            /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: "flex flex-wrap gap-x-3 gap-y-2", children: serviceItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("span", { className: "flex items-center text-sm text-text-sub", children: [
              /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ShieldCheck, { size: 12, className: "mr-1 text-primary-start" }),
              item
            ] }, item)) })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(ChevronRight, { size: 16, className: "mt-0.5 shrink-0 text-text-aux" })
        ] })
      }
    )
  ] });
};

// src/features/product-detail/components/ProductPurchaseBar.tsx
var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
var ProductPurchaseBar = ({
  onAddToCart,
  onBuyNow,
  onOpenCart,
  onOpenHelp,
  onOpenStore
}) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-border-light bg-white px-2 py-2 pb-safe dark:bg-gray-900", children: [
  /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "flex items-center space-x-4 px-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      "button",
      {
        type: "button",
        className: "flex flex-col items-center text-text-main active:opacity-70",
        onClick: onOpenStore,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Store, { size: 20, className: "mb-0.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "text-xs", children: "\u5546\u57CE" })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      "button",
      {
        type: "button",
        className: "flex flex-col items-center text-text-main active:opacity-70",
        onClick: onOpenHelp,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(MessageCircle, { size: 20, className: "mb-0.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "text-xs", children: "\u5BA2\u670D" })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
      "button",
      {
        type: "button",
        className: "flex flex-col items-center text-text-main active:opacity-70",
        onClick: onOpenCart,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ShoppingCart, { size: 20, className: "mb-0.5" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "text-xs", children: "\u8D2D\u7269\u8F66" })
        ]
      }
    )
  ] }),
  /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "ml-4 flex flex-1 space-x-2", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
      Button,
      {
        variant: "outline",
        className: "h-[40px] flex-1 rounded-full border-primary-start text-base text-primary-start",
        onClick: onAddToCart,
        children: "\u52A0\u5165\u8D2D\u7269\u8F66"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Button, { className: "h-[40px] flex-1 rounded-full text-base", onClick: onBuyNow, children: "\u7ACB\u5373\u8D2D\u4E70" })
  ] })
] });

// src/features/product-detail/components/ProductReviewsSection.tsx
var import_jsx_runtime12 = __toESM(require_jsx_runtime(), 1);
var ProductReviewsSection = ({
  loading,
  moduleError,
  onOpenQa,
  onOpenReviews,
  onRetry,
  summary
}) => {
  if (moduleError) {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(Card, { className: "m-4 flex flex-col items-center justify-center p-6", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(RefreshCcw, { size: 24, className: "mb-2 text-text-aux" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "mb-3 text-sm text-text-sub", children: "\u8BC4\u4EF7\u6458\u8981\u52A0\u8F7D\u5931\u8D25" }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
        "button",
        {
          onClick: onRetry,
          className: "rounded-full border border-border-light px-4 py-1 text-sm text-text-main",
          children: "\u91CD\u8BD5"
        }
      )
    ] });
  }
  if (loading) {
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(Card, { className: "m-4 space-y-4 p-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-5 w-20" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-16" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "space-y-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-6 w-6 rounded-full" }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-16" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-full" }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Skeleton, { className: "h-4 w-3/4" })
      ] })
    ] });
  }
  const preview = summary?.preview?.[0];
  const previewImages = preview ? getShopProductReviewImages(preview) : [];
  const totalReviews = summary?.total ?? 0;
  const summaryText = totalReviews > 0 && summary?.good_rate != null ? `\u597D\u8BC4\u7387 ${summary.good_rate}% \xB7 \u5171 ${totalReviews} \u6761` : `\u6682\u65E0\u8BC4\u4EF7 \xB7 \u5171 ${totalReviews} \u6761`;
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(Card, { className: "m-4 p-4", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
      "div",
      {
        className: "mb-4 flex cursor-pointer items-center justify-between active:opacity-70",
        onClick: onOpenReviews,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { className: "mr-2 text-lg font-bold text-text-main", children: "\u7528\u6237\u8BC4\u4EF7" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "text-sm text-text-sub", children: summaryText })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center text-sm text-text-sub", children: [
            "\u67E5\u770B\u5168\u90E8",
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ChevronRight, { size: 14 })
          ] })
        ]
      }
    ),
    preview ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "space-y-4", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "border-b border-border-light pb-4 last:border-0 last:pb-0", children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "mb-2 flex items-center justify-between", children: [
        /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
            "img",
            {
              src: resolveShopProductImageUrl(preview.avatar),
              alt: getShopProductReviewUser(preview),
              className: "h-6 w-6 rounded-full object-cover",
              referrerPolicy: "no-referrer"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "text-sm text-text-main", children: getShopProductReviewUser(preview) }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "flex text-primary-start", children: Array.from({ length: preview.rating ?? 5 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Star, { size: 10, fill: "currentColor" }, index)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "text-xs text-text-aux", children: preview.time || "--" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { className: "mb-2 line-clamp-3 text-base text-text-main", children: preview.content || "\u8BE5\u7528\u6237\u6682\u672A\u586B\u5199\u8BC4\u4EF7\u5185\u5BB9" }),
      preview.purchase_info && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "mb-2 text-xs text-text-sub", children: preview.purchase_info }),
      previewImages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "flex space-x-2 overflow-x-auto", children: previewImages.map((image) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
        "img",
        {
          src: image,
          className: "h-16 w-16 shrink-0 rounded-lg object-cover",
          referrerPolicy: "no-referrer"
        },
        image
      )) })
    ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("div", { className: "rounded-xl bg-bg-base p-4 text-sm text-text-sub", children: "\u5F53\u524D\u5546\u54C1\u8FD8\u6CA1\u6709\u516C\u5F00\u8BC4\u4EF7\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(
      "div",
      {
        className: "mt-4 flex cursor-pointer items-center justify-between border-t border-border-light pt-4 active:opacity-70",
        onClick: onOpenQa,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center", children: [
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("h3", { className: "mr-2 text-md font-bold text-text-main", children: "\u5546\u54C1\u95EE\u7B54" }),
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "text-sm text-text-sub", children: "\u67E5\u770B\u5546\u54C1\u76F8\u5173\u54A8\u8BE2" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: "flex items-center text-sm text-text-sub", children: [
            "\u53BB\u63D0\u95EE",
            /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ChevronRight, { size: 14 })
          ] })
        ]
      }
    )
  ] });
};

// src/features/product-detail/components/ProductSkuSheet.tsx
var import_jsx_runtime13 = __toESM(require_jsx_runtime(), 1);
var ProductSkuSheet = ({
  addresses,
  isOpen,
  mode,
  onAddToCart,
  onClose,
  onConfirm,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onManageAddress,
  onSelectOption,
  optionGroups,
  product,
  quantity,
  selectedAddress,
  setSelectedAddress,
  selectedOptions
}) => {
  if (!isOpen || !product) {
    return null;
  }
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "fixed inset-0 z-50 flex flex-col justify-end", children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "relative z-10 flex max-h-[80vh] w-full flex-col rounded-t-[24px] bg-white dark:bg-gray-900", children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        "button",
        {
          onClick: onClose,
          className: "absolute right-4 top-4 rounded-full p-1 text-text-sub active:bg-bg-base",
          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(X, { size: 20 })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex space-x-4 border-b border-border-light p-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          "img",
          {
            src: resolveShopProductImageUrl(product.thumbnail),
            alt: product.name,
            className: "-mt-8 h-24 w-24 rounded-lg border border-border-light bg-white object-cover shadow-sm dark:bg-gray-900",
            referrerPolicy: "no-referrer"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex flex-col justify-end pb-1", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "mb-1 text-xl font-bold text-primary-start", children: getShopProductPrimaryPrice(product) }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { className: "mb-1 text-sm text-text-sub", children: [
            "\u5E93\u5B58 ",
            product.stock
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("span", { className: "line-clamp-1 text-sm text-text-main", children: [
            "\u5DF2\u9009 ",
            buildShopProductSelectedSummary(optionGroups, selectedOptions, quantity)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex-1 space-y-6 overflow-y-auto p-4", children: [
        mode !== "cart" ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "mb-3 flex items-center justify-between", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h4", { className: "text-md font-bold text-text-main", children: "\u6536\u8D27\u5730\u5740" }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
              "button",
              {
                type: "button",
                onClick: onManageAddress,
                className: "inline-flex items-center text-sm text-primary-start active:opacity-70",
                children: [
                  selectedAddress ? "\u7BA1\u7406\u5730\u5740" : "\u65B0\u589E\u5730\u5740",
                  /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ChevronRight, { size: 14, className: "ml-0.5" })
                ]
              }
            )
          ] }),
          selectedAddress ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "rounded-2xl border border-border-light bg-bg-base p-3", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-start/10 text-primary-start", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(MapPin, { size: 15 }) }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "text-sm font-semibold text-text-main", children: selectedAddress.name }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "text-sm text-text-main", children: selectedAddress.phone }),
                selectedAddress.is_default ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "rounded bg-primary-start px-1.5 py-0.5 text-xs text-white", children: "\u9ED8\u8BA4" }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "mt-1 text-sm leading-5 text-text-sub", children: [
                selectedAddress.region,
                " ",
                selectedAddress.detail
              ] })
            ] })
          ] }) }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
            "button",
            {
              type: "button",
              onClick: onManageAddress,
              className: "flex w-full items-center justify-between rounded-2xl border border-dashed border-border-light bg-bg-base p-4 text-left active:bg-bg-hover",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "text-sm font-medium text-text-main", children: "\u8BF7\u9009\u62E9\u6536\u8D27\u5730\u5740" }),
                  /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "mt-1 text-sm text-text-sub", children: "\u4E0B\u5355\u524D\u9700\u8981\u5148\u9009\u62E9\u5730\u5740" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ChevronRight, { size: 16, className: "text-text-aux" })
              ]
            }
          ),
          addresses.length > 1 ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "mt-3 space-y-2", children: addresses.map((address) => {
            const active = selectedAddress?.id === address.id;
            return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(
              "button",
              {
                type: "button",
                onClick: () => setSelectedAddress(address),
                className: `w-full rounded-2xl border p-3 text-left transition-colors ${active ? "border-primary-start/30 bg-red-50 text-primary-start dark:bg-red-500/10" : "border-border-light bg-white text-text-main dark:bg-gray-900"}`,
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "text-sm font-medium", children: address.name }),
                    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("span", { className: "text-sm", children: address.phone })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: `mt-1 text-sm ${active ? "text-primary-start/90 dark:text-red-300" : "text-text-sub"}`, children: [
                    address.region,
                    " ",
                    address.detail
                  ] })
                ]
              },
              address.id
            );
          }) }) : null
        ] }) : null,
        optionGroups.length > 0 ? optionGroups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h4", { className: "mb-3 text-md font-bold text-text-main", children: group.name }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "flex flex-wrap gap-3", children: group.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
            "button",
            {
              onClick: () => onSelectOption(group.name, option),
              className: `rounded-full border px-4 py-1.5 text-base ${selectedOptions[group.name] === option ? "border-primary-start bg-red-50 font-medium text-primary-start" : "border-transparent bg-bg-base text-text-main"}`,
              children: option
            },
            option
          )) })
        ] }, group.name)) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "rounded-xl bg-bg-base p-4 text-sm text-text-sub", children: "\u5F53\u524D\u5546\u54C1\u6682\u65E0\u53EF\u9009\u89C4\u683C\uFF0C\u76F4\u63A5\u9009\u62E9\u6570\u91CF\u5373\u53EF\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex items-center justify-between pb-4 pt-2", children: [
          /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h4", { className: "text-md font-bold text-text-main", children: "\u6570\u91CF" }),
          /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex items-center rounded-full border border-border-light bg-bg-base", children: [
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
              "button",
              {
                className: "flex h-8 w-8 items-center justify-center text-text-main disabled:text-text-aux",
                onClick: onDecreaseQuantity,
                disabled: quantity <= 1,
                children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Minus, { size: 14 })
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "flex h-8 w-10 items-center justify-center border-x border-border-light bg-white text-base font-medium text-text-main dark:bg-gray-900", children: quantity }),
            /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
              "button",
              {
                className: "flex h-8 w-8 items-center justify-center text-text-main",
                onClick: onIncreaseQuantity,
                children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Plus, { size: 14 })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "border-t border-border-light bg-white p-2 pb-safe dark:bg-gray-900", children: mode === "select" ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: "flex space-x-2 px-2", children: [
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
          Button,
          {
            variant: "outline",
            className: "flex-1 rounded-full border-primary-start text-primary-start",
            onClick: onAddToCart,
            children: "\u52A0\u5165\u8D2D\u7269\u8F66"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Button, { className: "flex-1 rounded-full", onClick: onConfirm, children: "\u7ACB\u5373\u8D2D\u4E70" })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "px-2", children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(
        Button,
        {
          className: "w-full rounded-full",
          onClick: mode === "cart" ? onAddToCart : onConfirm,
          children: mode === "cart" ? "\u52A0\u5165\u8D2D\u7269\u8F66" : "\u786E\u8BA4"
        }
      ) }) })
    ] })
  ] });
};

// src/features/product-detail/components/ProductServiceSheet.tsx
var import_jsx_runtime14 = __toESM(require_jsx_runtime(), 1);
function getServiceIcon(text) {
  if (text.includes("\u5305\u90AE") || text.includes("\u53D1\u8D27")) return Truck;
  if (text.includes("\u9000") || text.includes("\u6362")) return RotateCcw;
  if (text.includes("\u8D28\u4FDD") || text.includes("\u4FDD\u4FEE")) return ShieldCheck;
  return Package;
}
var ProductServiceSheet = ({
  isOpen,
  onClose,
  product
}) => {
  if (!isOpen) {
    return null;
  }
  const serviceItems = buildShopProductServiceItems(product);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "fixed inset-0 z-50 flex flex-col justify-end", children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm", onClick: onClose }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "relative z-10 flex max-h-[60vh] w-full flex-col rounded-t-[24px] bg-white dark:bg-gray-900", children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        "button",
        {
          onClick: onClose,
          className: "absolute right-4 top-4 rounded-full p-1 text-text-sub active:bg-bg-base",
          children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(X, { size: 20 })
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "border-b border-border-light px-4 pb-3 pt-4", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h3", { className: "text-lg font-bold text-text-main", children: "\u670D\u52A1\u8BF4\u660E" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex-1 overflow-y-auto p-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "space-y-4", children: serviceItems.map((item) => {
          const Icon2 = getServiceIcon(item);
          return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "flex items-start space-x-3", children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-start/10", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(Icon2, { size: 16, className: "text-primary-start" }) }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "flex-1 pt-1", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { className: "text-base text-text-main", children: item }) })
          ] }, item);
        }) }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: "mt-6 rounded-xl bg-bg-base p-4", children: [
          /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("h4", { className: "mb-2 text-sm font-bold text-text-main", children: "\u5E73\u53F0\u4FDD\u969C" }),
          /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("ul", { className: "space-y-1.5 text-sm text-text-sub", children: [
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("li", { className: "flex items-center", children: [
              /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ShieldCheck, { size: 12, className: "mr-2 shrink-0 text-primary-start" }),
              "\u81EA\u8425\u5546\u54C1\u7531\u5E73\u53F0\u76F4\u63A5\u53D1\u8D27\uFF0C\u54C1\u8D28\u4FDD\u8BC1"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("li", { className: "flex items-center", children: [
              /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ShieldCheck, { size: 12, className: "mr-2 shrink-0 text-primary-start" }),
              "\u652F\u63017\u5929\u65E0\u7406\u7531\u9000\u6362\u8D27"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("li", { className: "flex items-center", children: [
              /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ShieldCheck, { size: 12, className: "mr-2 shrink-0 text-primary-start" }),
              "\u5982\u5546\u54C1\u6709\u8D28\u91CF\u95EE\u9898\uFF0C\u53EF\u8054\u7CFB\u5BA2\u670D\u5904\u7406"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: "border-t border-border-light p-4 pb-safe", children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        "button",
        {
          type: "button",
          className: "w-full rounded-full bg-gradient-to-r from-primary-start to-primary-end py-3 text-base font-medium text-white active:opacity-90",
          onClick: onClose,
          children: "\u6211\u77E5\u9053\u4E86"
        }
      ) })
    ] })
  ] });
};

// src/features/product-detail/constants.ts
var PRODUCT_DETAIL_TABS = [
  { id: "details", label: "\u5546\u54C1\u8BE6\u60C5" },
  { id: "params", label: "\u89C4\u683C\u53C2\u6570" },
  { id: "guarantee", label: "\u552E\u540E\u4FDD\u969C" }
];

// src/features/product-detail/components/ProductTabsSection.tsx
var import_jsx_runtime15 = __toESM(require_jsx_runtime(), 1);
var ProductTabsSection = ({
  activeTab,
  loading,
  onChange,
  product
}) => {
  const specs = buildShopProductSpecs(product);
  const serviceItems = buildShopProductServiceItems(product);
  const parameterRows = specs.length > 0 ? specs : [
    { name: "\u5546\u54C1\u5206\u7C7B", value: product?.category || "--" },
    { name: "\u8D2D\u4E70\u65B9\u5F0F", value: product ? getShopProductPurchaseTag(product) : "--" },
    { name: "\u5E93\u5B58", value: String(product?.stock ?? 0) },
    { name: "\u9500\u91CF", value: String(product?.sales ?? 0) }
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "mt-4 bg-white pb-4 dark:bg-gray-900", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "sticky top-12 z-30 flex border-b border-border-light bg-white dark:bg-gray-900", children: PRODUCT_DETAIL_TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
      "button",
      {
        onClick: () => onChange(tab.id),
        className: `relative flex-1 py-3 text-md font-medium ${activeTab === tab.id ? "text-primary-start" : "text-text-main"}`,
        children: [
          tab.label,
          activeTab === tab.id && /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: "absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary-start" })
        ]
      },
      tab.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "p-4", children: loading ? /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { className: "space-y-4", children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Skeleton, { className: "h-48 w-full" }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(Skeleton, { className: "h-48 w-full" })
    ] }) : activeTab === "details" ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "space-y-3", children: (product?.detail_images ?? []).length > 0 ? product?.detail_images.map((image) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
      "img",
      {
        src: resolveShopProductImageUrl(image),
        alt: product.name,
        className: "w-full rounded-lg",
        referrerPolicy: "no-referrer"
      },
      image
    )) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "rounded-xl border border-border-light bg-bg-base p-4 text-sm leading-6 text-text-sub", children: buildShopProductDescription(product) }) }) : activeTab === "params" ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "overflow-hidden rounded-lg border border-border-light", children: parameterRows.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
      "div",
      {
        className: `flex text-sm ${index < parameterRows.length - 1 ? "border-b border-border-light" : ""}`,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "w-1/3 bg-bg-base p-2 text-text-sub", children: item.name }),
          /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "w-2/3 p-2 text-text-main", children: item.value })
        ]
      },
      `${item.name}-${index}`
    )) }) : /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: "space-y-4 text-base text-text-main", children: serviceItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("h4", { className: "mb-1 flex items-center font-bold", children: [
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(ShieldCheck, { size: 14, className: "mr-1 text-primary-start" }),
        "\u670D\u52A1\u8BF4\u660E"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { className: "text-sm text-text-sub", children: item })
    ] }, item)) }) })
  ] });
};

// src/hooks/useNetworkStatus.ts
var import_react5 = __toESM(require_react(), 1);

// src/lib/appLifecycle.ts
var import_react4 = __toESM(require_react(), 1);
var listeners = /* @__PURE__ */ new Set();
var stopObserver = null;
function canUseDOM() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
function getVisibilityState() {
  if (!canUseDOM()) {
    return "hidden";
  }
  return document.visibilityState;
}
function getHasFocus() {
  if (!canUseDOM()) {
    return false;
  }
  return document.hasFocus();
}
function getIsOnline() {
  if (typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine;
}
function resolveAppState(visibilityState, hasFocus) {
  if (visibilityState === "hidden") {
    return "background";
  }
  return hasFocus ? "active" : "inactive";
}
function createInitialSnapshot() {
  const now = Date.now();
  const visibilityState = getVisibilityState();
  const hasFocus = getHasFocus();
  const isOnline = getIsOnline();
  const appState = resolveAppState(visibilityState, hasFocus);
  return {
    appState,
    hasFocus,
    isOffline: !isOnline,
    isOnline,
    isVisible: visibilityState === "visible",
    lastBecameActiveAt: appState === "active" ? now : null,
    lastBecameHiddenAt: visibilityState === "hidden" ? now : null,
    lastUpdatedAt: now,
    lastWentOfflineAt: isOnline ? null : now,
    lastWentOnlineAt: isOnline ? now : null,
    visibilityState
  };
}
var snapshot = createInitialSnapshot();
function hasMeaningfulChange(nextSnapshot) {
  return snapshot.appState !== nextSnapshot.appState || snapshot.hasFocus !== nextSnapshot.hasFocus || snapshot.isOnline !== nextSnapshot.isOnline || snapshot.visibilityState !== nextSnapshot.visibilityState;
}
function computeNextSnapshot() {
  const now = Date.now();
  const visibilityState = getVisibilityState();
  const hasFocus = getHasFocus();
  const isOnline = getIsOnline();
  const appState = resolveAppState(visibilityState, hasFocus);
  return {
    appState,
    hasFocus,
    isOffline: !isOnline,
    isOnline,
    isVisible: visibilityState === "visible",
    lastBecameActiveAt: appState === "active" && snapshot.appState !== "active" ? now : snapshot.lastBecameActiveAt,
    lastBecameHiddenAt: visibilityState === "hidden" && snapshot.visibilityState !== "hidden" ? now : snapshot.lastBecameHiddenAt,
    lastUpdatedAt: now,
    lastWentOfflineAt: !isOnline && snapshot.isOnline ? now : snapshot.lastWentOfflineAt,
    lastWentOnlineAt: isOnline && snapshot.isOffline ? now : snapshot.lastWentOnlineAt,
    visibilityState
  };
}
function notifyListeners() {
  listeners.forEach((listener) => {
    listener();
  });
}
function refreshSnapshot() {
  const nextSnapshot = computeNextSnapshot();
  if (!hasMeaningfulChange(nextSnapshot)) {
    return snapshot;
  }
  snapshot = nextSnapshot;
  notifyListeners();
  return snapshot;
}
function attachObserver() {
  if (!canUseDOM() || stopObserver) {
    return;
  }
  const handleChange = () => {
    refreshSnapshot();
  };
  window.addEventListener("focus", handleChange);
  window.addEventListener("blur", handleChange);
  window.addEventListener("online", handleChange);
  window.addEventListener("offline", handleChange);
  window.addEventListener("pageshow", handleChange);
  window.addEventListener("pagehide", handleChange);
  document.addEventListener("visibilitychange", handleChange);
  stopObserver = () => {
    window.removeEventListener("focus", handleChange);
    window.removeEventListener("blur", handleChange);
    window.removeEventListener("online", handleChange);
    window.removeEventListener("offline", handleChange);
    window.removeEventListener("pageshow", handleChange);
    window.removeEventListener("pagehide", handleChange);
    document.removeEventListener("visibilitychange", handleChange);
    stopObserver = null;
  };
}
function refreshAppLifecycleSnapshot() {
  return refreshSnapshot();
}
function getAppLifecycleSnapshot() {
  attachObserver();
  return snapshot;
}
function subscribeAppLifecycleChange(listener) {
  attachObserver();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function useAppLifecycle() {
  return (0, import_react4.useSyncExternalStore)(
    subscribeAppLifecycleChange,
    getAppLifecycleSnapshot,
    getAppLifecycleSnapshot
  );
}

// src/hooks/useNetworkStatus.ts
var useNetworkStatus = () => {
  const { isOffline } = useAppLifecycle();
  const refreshStatus = (0, import_react5.useCallback)(() => {
    refreshAppLifecycleSnapshot();
  }, []);
  return {
    isOffline,
    refreshStatus
  };
};

// src/hooks/useRequest.ts
var import_react6 = __toESM(require_react(), 1);
var globalCache = /* @__PURE__ */ new Map();
var DEFAULT_CACHE_TTL = 5 * 60 * 1e3;
function buildCacheKey(deps) {
  return deps.map((dep) => {
    if (dep === null) return "null";
    if (dep === void 0) return "undefined";
    if (typeof dep === "object") return JSON.stringify(dep);
    return String(dep);
  }).join("::");
}
function useRequest(service, options = {}) {
  const {
    cache = true,
    cacheKey: customCacheKey,
    cacheTTL = DEFAULT_CACHE_TTL,
    deps = [],
    initialData,
    keepPreviousData = true,
    manual = false
  } = options;
  const resolvedCacheKey = cache ? customCacheKey ?? buildCacheKey(deps) : "";
  const getCachedData = () => {
    if (!resolvedCacheKey) return void 0;
    const entry = globalCache.get(resolvedCacheKey);
    if (!entry) return void 0;
    if (Date.now() - entry.timestamp > cacheTTL) {
      globalCache.delete(resolvedCacheKey);
      return void 0;
    }
    return entry.data;
  };
  const cachedData = getCachedData();
  const hasCache = cachedData !== void 0;
  const [data, setData] = (0, import_react6.useState)(cachedData ?? initialData);
  const [error, setError] = (0, import_react6.useState)(null);
  const [loading, setLoading] = (0, import_react6.useState)(!manual && !hasCache);
  const abortRef = (0, import_react6.useRef)(null);
  const initialDataRef = (0, import_react6.useRef)(initialData);
  const keepPreviousDataRef = (0, import_react6.useRef)(keepPreviousData);
  const requestIdRef = (0, import_react6.useRef)(0);
  const serviceRef = (0, import_react6.useRef)(service);
  const cacheKeyRef = (0, import_react6.useRef)(resolvedCacheKey);
  (0, import_react6.useEffect)(() => {
    serviceRef.current = service;
  }, [service]);
  (0, import_react6.useEffect)(() => {
    initialDataRef.current = initialData;
  }, [initialData]);
  (0, import_react6.useEffect)(() => {
    keepPreviousDataRef.current = keepPreviousData;
  }, [keepPreviousData]);
  (0, import_react6.useEffect)(() => {
    cacheKeyRef.current = resolvedCacheKey;
  }, [resolvedCacheKey]);
  const reload = (0, import_react6.useCallback)(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!keepPreviousDataRef.current) {
      setData(initialDataRef.current);
    }
    setLoading(true);
    setError(null);
    try {
      const response = await serviceRef.current(controller.signal);
      if (controller.signal.aborted || requestId !== requestIdRef.current) {
        return void 0;
      }
      (0, import_react6.startTransition)(() => {
        setData(response);
      });
      const currentKey = cacheKeyRef.current;
      if (currentKey) {
        globalCache.set(currentKey, { data: response, timestamp: Date.now() });
      }
      return response;
    } catch (nextError) {
      if (controller.signal.aborted || isAbortError(nextError)) {
        return void 0;
      }
      const normalizedError = nextError instanceof Error ? nextError : new Error("Request failed.");
      if (requestId === requestIdRef.current) {
        setError(normalizedError);
      }
      throw normalizedError;
    } finally {
      if (requestId === requestIdRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);
  (0, import_react6.useEffect)(() => {
    if (manual) {
      setLoading(false);
      return;
    }
    void reload().catch(() => void 0);
  }, [manual, reload, ...deps]);
  (0, import_react6.useEffect)(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);
  return {
    data,
    error,
    loading,
    reload,
    setData
  };
}

// src/lib/navigation.ts
var import_react7 = __toESM(require_react(), 1);
var VIEW_TO_PATH = {
  // 搴曢儴 Tab 椤碉紙涓€绾ц矾鐢憋級
  home: "/",
  store: "/store",
  shield: "/shield",
  order: "/order",
  user: "/user",
  // 瀛愰〉闈㈣矾鐢?
  product_detail: "/product/0",
  // 榛樿 ID锛屽疄闄呬娇鐢ㄦ椂浼犲叆鍏蜂綋 ID
  category: "/category",
  search: "/search",
  search_result: "/search/result",
  cart: "/cart",
  checkout: "/checkout",
  cashier: "/cashier",
  payment_result: "/payment/result",
  order_detail: "/order/detail/0",
  // 榛樿 ID
  logistics: "/logistics/0",
  // 榛樿 ID
  after_sales: "/after-sales",
  coupon: "/coupon",
  consignment_voucher: "/consignment-voucher",
  address: "/address",
  payment_accounts: "/payment-accounts",
  favorites: "/favorites",
  message_center: "/messages",
  announcement: "/announcement",
  activity_center: "/activity-center",
  help_center: "/help",
  settings: "/settings",
  change_password: "/change-password",
  change_pay_password: "/change-pay-password",
  reset_password: "/reset-password",
  reset_pay_password: "/reset-pay-password",
  about: "/about",
  user_agreement: "/user_agreement",
  privacy_policy: "/privacy_policy",
  security: "/security",
  billing: "/billing",
  my_collection: "/my-collection",
  my_card_packs: "/my-card-packs",
  accumulated_rights: "/accumulated-rights",
  growth_rights: "/accumulated-rights",
  real_name_auth: "/auth/real-name",
  invite: "/invite",
  friends: "/friends",
  trading_zone: "/trading",
  trading_detail: "/trading/detail/0",
  // 榛樿 ID
  pre_order: "/trading/pre-order/0",
  // 榛樿 ID
  rights_history: "/rights/history",
  recharge: "/recharge",
  transfer: "/transfer",
  rights_transfer: "/rights/transfer",
  withdraw: "/withdraw",
  live: "/live",
  live_webview: "/live/view",
  reservations: "/reservations",
  flash_sale: "/flash-sale",
  product_qa: "/product/0/qa",
  // 榛樿 ID
  reviews: "/product/0/reviews",
  // 榛樿 ID
  add_review: "/product/0/review/new",
  // 榛樿 ID
  service_description: "/service-description",
  sign_in: "/sign-in",
  login: "/login",
  register: "/register",
  design: "/design"
};
function useAppNavigate() {
  const navigate = useNavigate();
  const canGoBack = (0, import_react7.useCallback)(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const historyState = window.history.state;
    if (typeof historyState?.idx === "number") {
      return historyState.idx > 0;
    }
    return window.history.length > 1;
  }, []);
  const goTo = (0, import_react7.useCallback)((viewId) => {
    const path = VIEW_TO_PATH[viewId];
    if (path) {
      navigate(path);
    } else {
      navigate(viewId);
    }
  }, [navigate]);
  const goBack = (0, import_react7.useCallback)(() => {
    navigate(-1);
  }, [navigate]);
  const goBackOr = (0, import_react7.useCallback)((fallbackViewId) => {
    if (canGoBack()) {
      navigate(-1);
      return;
    }
    const fallbackPath = VIEW_TO_PATH[fallbackViewId];
    navigate(fallbackPath ?? fallbackViewId);
  }, [canGoBack, navigate]);
  return (0, import_react7.useMemo)(() => ({ goTo, goBack, goBackOr, navigate }), [goTo, goBack, goBackOr, navigate]);
}

// src/lib/customerService.ts
async function openCustomerServiceLink(showToast) {
  try {
    const config = await commonApi.getChatConfig();
    const url = config.chatUrl || config.backupUrl;
    if (!url) {
      showToast({
        message: "\u6682\u672A\u914D\u7F6E\u5BA2\u670D\u94FE\u63A5",
        type: "warning"
      });
      return false;
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      showToast({
        message: "\u6253\u5F00\u5BA2\u670D\u94FE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u5907\u8BBE\u7F6E",
        type: "error"
      });
      return false;
    }
    return true;
  } catch (error) {
    showToast({
      message: getErrorMessage(error),
      type: "error"
    });
    return false;
  }
}

// src/components/biz/RegionPickerSheet.tsx
var import_react9 = __toESM(require_react(), 1);

// src/components/ui/WheelPicker.tsx
var import_react8 = __toESM(require_react(), 1);
var import_jsx_runtime16 = __toESM(require_jsx_runtime(), 1);
var WheelPicker = ({
  items,
  value,
  onChange,
  itemHeight = 44,
  visibleCount = 5
}) => {
  const containerRef = (0, import_react8.useRef)(null);
  const scrollRef = (0, import_react8.useRef)({
    startY: 0,
    startTranslateY: 0,
    translateY: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    animationId: 0,
    isDragging: false
  });
  const halfVisible = Math.floor(visibleCount / 2);
  const containerHeight = itemHeight * visibleCount;
  const selectedIndex = items.findIndex((item) => item.value === value);
  const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const itemsRef = (0, import_react8.useRef)([]);
  const contentRef = (0, import_react8.useRef)(null);
  (0, import_react8.useEffect)(() => {
    const idx = items.findIndex((item) => item.value === value);
    if (idx >= 0) {
      const targetY = -idx * itemHeight;
      scrollRef.current.translateY = targetY;
      updateDOM(targetY, false);
    }
  }, [value, items, itemHeight]);
  const updateDOM = (0, import_react8.useCallback)((y, isDragging) => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${y + halfVisible * itemHeight}px)`;
      contentRef.current.style.transition = isDragging ? "none" : "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
    }
    itemsRef.current.forEach((el, index) => {
      if (!el) return;
      const offset = index + y / itemHeight;
      const absOffset = Math.abs(offset);
      const scale = Math.max(0.7, 1 - absOffset * 0.08);
      const opacity = items[index]?.disabled ? 0.3 : Math.max(0.3, 1 - absOffset * 0.2);
      el.style.transform = `scale(${scale})`;
      el.style.opacity = `${opacity}`;
      el.style.transition = isDragging ? "none" : "transform 0.3s, opacity 0.3s";
      const span = el.querySelector("span");
      if (span && !items[index]?.disabled) {
        if (absOffset < 0.5) {
          span.classList.add("text-primary-start", "font-bold", "text-xl");
          span.classList.remove("text-text-main", "font-medium", "text-lg");
        } else {
          span.classList.remove("text-primary-start", "font-bold", "text-xl");
          span.classList.add("text-text-main", "font-medium", "text-lg");
        }
      }
    });
  }, [items, itemHeight, halfVisible]);
  const snapToNearest = (0, import_react8.useCallback)(
    (y) => {
      let index = Math.round(-y / itemHeight);
      index = Math.max(0, Math.min(items.length - 1, index));
      const origIndex = index;
      while (index < items.length && items[index]?.disabled) index++;
      if (index >= items.length) {
        index = origIndex;
        while (index >= 0 && items[index]?.disabled) index--;
      }
      if (index < 0) index = 0;
      const targetY = -index * itemHeight;
      scrollRef.current.translateY = targetY;
      updateDOM(targetY, false);
      const selectedItem = items[index];
      if (selectedItem && selectedItem.value !== value) {
        onChange?.(selectedItem.value, index);
      }
    },
    [items, itemHeight, onChange, value, updateDOM]
  );
  const startMomentum = (0, import_react8.useCallback)(
    (velocity) => {
      const friction = 0.95;
      const minVelocity = 0.5;
      const animate = () => {
        velocity *= friction;
        if (Math.abs(velocity) < minVelocity) {
          snapToNearest(scrollRef.current.translateY);
          return;
        }
        let newY = scrollRef.current.translateY + velocity;
        const maxY = 0;
        const minY = -(items.length - 1) * itemHeight;
        if (newY > maxY) {
          newY = maxY + (newY - maxY) * 0.3;
          velocity *= 0.5;
        } else if (newY < minY) {
          newY = minY + (newY - minY) * 0.3;
          velocity *= 0.5;
        }
        scrollRef.current.translateY = newY;
        updateDOM(newY, true);
        scrollRef.current.animationId = requestAnimationFrame(animate);
      };
      scrollRef.current.animationId = requestAnimationFrame(animate);
    },
    [items.length, itemHeight, snapToNearest]
  );
  const handleStart = (0, import_react8.useCallback)(
    (clientY) => {
      cancelAnimationFrame(scrollRef.current.animationId);
      scrollRef.current.isDragging = true;
      scrollRef.current.startY = clientY;
      scrollRef.current.startTranslateY = scrollRef.current.translateY;
      scrollRef.current.lastY = clientY;
      scrollRef.current.lastTime = Date.now();
      scrollRef.current.velocity = 0;
    },
    []
  );
  const handleMove = (0, import_react8.useCallback)(
    (clientY) => {
      if (!scrollRef.current.isDragging) return;
      const now = Date.now();
      const deltaTime = now - scrollRef.current.lastTime;
      const deltaY = clientY - scrollRef.current.lastY;
      if (deltaTime > 0) {
        scrollRef.current.velocity = deltaY / deltaTime * 16;
      }
      scrollRef.current.lastY = clientY;
      scrollRef.current.lastTime = now;
      let newY = scrollRef.current.startTranslateY + (clientY - scrollRef.current.startY);
      const maxY = 0;
      const minY = -(items.length - 1) * itemHeight;
      if (newY > maxY) {
        newY = maxY + (newY - maxY) * 0.3;
      } else if (newY < minY) {
        newY = minY + (newY - minY) * 0.3;
      }
      scrollRef.current.translateY = newY;
      requestAnimationFrame(() => updateDOM(newY, true));
    },
    [items.length, itemHeight, updateDOM]
  );
  const handleEnd = (0, import_react8.useCallback)(() => {
    if (!scrollRef.current.isDragging) return;
    scrollRef.current.isDragging = false;
    const velocity = scrollRef.current.velocity;
    if (Math.abs(velocity) > 2) {
      startMomentum(velocity);
    } else {
      snapToNearest(scrollRef.current.translateY);
    }
  }, [startMomentum, snapToNearest]);
  (0, import_react8.useEffect)(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleStart(e.touches[0].clientY);
    };
    const onTouchMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => handleEnd();
    const onMouseDown = (e) => {
      e.preventDefault();
      handleStart(e.clientY);
    };
    const onMouseMove = (e) => handleMove(e.clientY);
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => {
      if (scrollRef.current.isDragging) handleEnd();
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(scrollRef.current.animationId);
    };
  }, [handleStart, handleMove, handleEnd]);
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(
    "div",
    {
      ref: containerRef,
      className: "relative overflow-hidden select-none cursor-grab active:cursor-grabbing",
      style: { height: containerHeight, touchAction: "none" },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "div",
          {
            className: "absolute top-0 left-0 right-0 z-10 pointer-events-none",
            style: {
              height: halfVisible * itemHeight,
              background: "linear-gradient(to bottom, var(--color-bg-card, #fff) 10%, transparent 100%)"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "div",
          {
            className: "absolute bottom-0 left-0 right-0 z-10 pointer-events-none",
            style: {
              height: halfVisible * itemHeight,
              background: "linear-gradient(to top, var(--color-bg-card, #fff) 10%, transparent 100%)"
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
          "div",
          {
            className: "absolute left-3 right-3 z-5 border-y border-primary-start/30 bg-primary-start/5 rounded-lg pointer-events-none",
            style: {
              top: halfVisible * itemHeight,
              height: itemHeight
            }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { ref: contentRef, children: items.map((item, index) => {
          const isInitialSelected = index === currentIndex;
          const initialOpacity = item.disabled ? 0.3 : isInitialSelected ? 1 : 0.6;
          return /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
            "div",
            {
              ref: (el) => itemsRef.current[index] = el,
              className: "flex items-center justify-center transform transition-none",
              style: {
                height: itemHeight,
                opacity: initialOpacity
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)(
                "span",
                {
                  className: `transition-colors duration-200 ${isInitialSelected && !item.disabled ? "text-primary-start font-bold text-xl" : "text-text-main font-medium text-lg"} ${item.disabled ? "line-through text-text-aux" : ""}`,
                  children: item.label
                }
              )
            },
            item.value
          );
        }) })
      ]
    }
  );
};

// src/data/chinaAreaData.ts
var chinaAreaData = {
  "86": {
    "110000": "\u5317\u4EAC\u5E02",
    "120000": "\u5929\u6D25\u5E02",
    "130000": "\u6CB3\u5317\u7701",
    "140000": "\u5C71\u897F\u7701",
    "150000": "\u5185\u8499\u53E4\u81EA\u6CBB\u533A",
    "210000": "\u8FBD\u5B81\u7701",
    "220000": "\u5409\u6797\u7701",
    "230000": "\u9ED1\u9F99\u6C5F\u7701",
    "310000": "\u4E0A\u6D77\u5E02",
    "320000": "\u6C5F\u82CF\u7701",
    "330000": "\u6D59\u6C5F\u7701",
    "340000": "\u5B89\u5FBD\u7701",
    "350000": "\u798F\u5EFA\u7701",
    "360000": "\u6C5F\u897F\u7701",
    "370000": "\u5C71\u4E1C\u7701",
    "410000": "\u6CB3\u5357\u7701",
    "420000": "\u6E56\u5317\u7701",
    "430000": "\u6E56\u5357\u7701",
    "440000": "\u5E7F\u4E1C\u7701",
    "450000": "\u5E7F\u897F\u58EE\u65CF\u81EA\u6CBB\u533A",
    "460000": "\u6D77\u5357\u7701",
    "500000": "\u91CD\u5E86\u5E02",
    "510000": "\u56DB\u5DDD\u7701",
    "520000": "\u8D35\u5DDE\u7701",
    "530000": "\u4E91\u5357\u7701",
    "540000": "\u897F\u85CF\u81EA\u6CBB\u533A",
    "610000": "\u9655\u897F\u7701",
    "620000": "\u7518\u8083\u7701",
    "630000": "\u9752\u6D77\u7701",
    "640000": "\u5B81\u590F\u56DE\u65CF\u81EA\u6CBB\u533A",
    "650000": "\u65B0\u7586\u7EF4\u543E\u5C14\u81EA\u6CBB\u533A",
    "710000": "\u53F0\u6E7E\u7701",
    "810000": "\u9999\u6E2F\u7279\u522B\u884C\u653F\u533A",
    "820000": "\u6FB3\u95E8\u7279\u522B\u884C\u653F\u533A"
  },
  "110000": {
    "110100": "\u5E02\u8F96\u533A"
  },
  "110100": {
    "110101": "\u4E1C\u57CE\u533A",
    "110102": "\u897F\u57CE\u533A",
    "110105": "\u671D\u9633\u533A",
    "110106": "\u4E30\u53F0\u533A",
    "110107": "\u77F3\u666F\u5C71\u533A",
    "110108": "\u6D77\u6DC0\u533A",
    "110109": "\u95E8\u5934\u6C9F\u533A",
    "110111": "\u623F\u5C71\u533A",
    "110112": "\u901A\u5DDE\u533A",
    "110113": "\u987A\u4E49\u533A",
    "110114": "\u660C\u5E73\u533A",
    "110115": "\u5927\u5174\u533A",
    "110116": "\u6000\u67D4\u533A",
    "110117": "\u5E73\u8C37\u533A",
    "110118": "\u5BC6\u4E91\u533A",
    "110119": "\u5EF6\u5E86\u533A"
  },
  "120000": {
    "120100": "\u5E02\u8F96\u533A"
  },
  "120100": {
    "120101": "\u548C\u5E73\u533A",
    "120102": "\u6CB3\u4E1C\u533A",
    "120103": "\u6CB3\u897F\u533A",
    "120104": "\u5357\u5F00\u533A",
    "120105": "\u6CB3\u5317\u533A",
    "120106": "\u7EA2\u6865\u533A",
    "120110": "\u4E1C\u4E3D\u533A",
    "120111": "\u897F\u9752\u533A",
    "120112": "\u6D25\u5357\u533A",
    "120113": "\u5317\u8FB0\u533A",
    "120114": "\u6B66\u6E05\u533A",
    "120115": "\u5B9D\u577B\u533A",
    "120116": "\u6EE8\u6D77\u65B0\u533A",
    "120117": "\u5B81\u6CB3\u533A",
    "120118": "\u9759\u6D77\u533A",
    "120119": "\u84DF\u5DDE\u533A"
  },
  "130000": {
    "130100": "\u77F3\u5BB6\u5E84\u5E02",
    "130200": "\u5510\u5C71\u5E02",
    "130300": "\u79E6\u7687\u5C9B\u5E02",
    "130400": "\u90AF\u90F8\u5E02",
    "130500": "\u90A2\u53F0\u5E02",
    "130600": "\u4FDD\u5B9A\u5E02",
    "130700": "\u5F20\u5BB6\u53E3\u5E02",
    "130800": "\u627F\u5FB7\u5E02",
    "130900": "\u6CA7\u5DDE\u5E02",
    "131000": "\u5ECA\u574A\u5E02",
    "131100": "\u8861\u6C34\u5E02"
  },
  "130100": {
    "130101": "\u5E02\u8F96\u533A",
    "130102": "\u957F\u5B89\u533A",
    "130104": "\u6865\u897F\u533A",
    "130105": "\u65B0\u534E\u533A",
    "130107": "\u4E95\u9649\u77FF\u533A",
    "130108": "\u88D5\u534E\u533A",
    "130109": "\u85C1\u57CE\u533A",
    "130110": "\u9E7F\u6CC9\u533A",
    "130111": "\u683E\u57CE\u533A",
    "130121": "\u4E95\u9649\u53BF",
    "130123": "\u6B63\u5B9A\u53BF",
    "130125": "\u884C\u5510\u53BF",
    "130126": "\u7075\u5BFF\u53BF",
    "130127": "\u9AD8\u9091\u53BF",
    "130128": "\u6DF1\u6CFD\u53BF",
    "130129": "\u8D5E\u7687\u53BF",
    "130130": "\u65E0\u6781\u53BF",
    "130131": "\u5E73\u5C71\u53BF",
    "130132": "\u5143\u6C0F\u53BF",
    "130133": "\u8D75\u53BF",
    "130171": "\u77F3\u5BB6\u5E84\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "130172": "\u77F3\u5BB6\u5E84\u5FAA\u73AF\u5316\u5DE5\u56ED\u533A",
    "130181": "\u8F9B\u96C6\u5E02",
    "130183": "\u664B\u5DDE\u5E02",
    "130184": "\u65B0\u4E50\u5E02"
  },
  "130200": {
    "130201": "\u5E02\u8F96\u533A",
    "130202": "\u8DEF\u5357\u533A",
    "130203": "\u8DEF\u5317\u533A",
    "130204": "\u53E4\u51B6\u533A",
    "130205": "\u5F00\u5E73\u533A",
    "130207": "\u4E30\u5357\u533A",
    "130208": "\u4E30\u6DA6\u533A",
    "130209": "\u66F9\u5983\u7538\u533A",
    "130224": "\u6EE6\u5357\u53BF",
    "130225": "\u4E50\u4EAD\u53BF",
    "130227": "\u8FC1\u897F\u53BF",
    "130229": "\u7389\u7530\u53BF",
    "130271": "\u6CB3\u5317\u5510\u5C71\u82A6\u53F0\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "130272": "\u5510\u5C71\u5E02\u6C49\u6CBD\u7BA1\u7406\u533A",
    "130273": "\u5510\u5C71\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "130274": "\u6CB3\u5317\u5510\u5C71\u6D77\u6E2F\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "130281": "\u9075\u5316\u5E02",
    "130283": "\u8FC1\u5B89\u5E02",
    "130284": "\u6EE6\u5DDE\u5E02"
  },
  "130300": {
    "130301": "\u5E02\u8F96\u533A",
    "130302": "\u6D77\u6E2F\u533A",
    "130303": "\u5C71\u6D77\u5173\u533A",
    "130304": "\u5317\u6234\u6CB3\u533A",
    "130306": "\u629A\u5B81\u533A",
    "130321": "\u9752\u9F99\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "130322": "\u660C\u9ECE\u53BF",
    "130324": "\u5362\u9F99\u53BF",
    "130371": "\u79E6\u7687\u5C9B\u5E02\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "130372": "\u5317\u6234\u6CB3\u65B0\u533A"
  },
  "130400": {
    "130401": "\u5E02\u8F96\u533A",
    "130402": "\u90AF\u5C71\u533A",
    "130403": "\u4E1B\u53F0\u533A",
    "130404": "\u590D\u5174\u533A",
    "130406": "\u5CF0\u5CF0\u77FF\u533A",
    "130407": "\u80A5\u4E61\u533A",
    "130408": "\u6C38\u5E74\u533A",
    "130423": "\u4E34\u6F33\u53BF",
    "130424": "\u6210\u5B89\u53BF",
    "130425": "\u5927\u540D\u53BF",
    "130426": "\u6D89\u53BF",
    "130427": "\u78C1\u53BF",
    "130430": "\u90B1\u53BF",
    "130431": "\u9E21\u6CFD\u53BF",
    "130432": "\u5E7F\u5E73\u53BF",
    "130433": "\u9986\u9676\u53BF",
    "130434": "\u9B4F\u53BF",
    "130435": "\u66F2\u5468\u53BF",
    "130471": "\u90AF\u90F8\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "130473": "\u90AF\u90F8\u5180\u5357\u65B0\u533A",
    "130481": "\u6B66\u5B89\u5E02"
  },
  "130500": {
    "130501": "\u5E02\u8F96\u533A",
    "130502": "\u6865\u4E1C\u533A",
    "130503": "\u6865\u897F\u533A",
    "130521": "\u90A2\u53F0\u53BF",
    "130522": "\u4E34\u57CE\u53BF",
    "130523": "\u5185\u4E18\u53BF",
    "130524": "\u67CF\u4E61\u53BF",
    "130525": "\u9686\u5C27\u53BF",
    "130526": "\u4EFB\u53BF",
    "130527": "\u5357\u548C\u53BF",
    "130528": "\u5B81\u664B\u53BF",
    "130529": "\u5DE8\u9E7F\u53BF",
    "130530": "\u65B0\u6CB3\u53BF",
    "130531": "\u5E7F\u5B97\u53BF",
    "130532": "\u5E73\u4E61\u53BF",
    "130533": "\u5A01\u53BF",
    "130534": "\u6E05\u6CB3\u53BF",
    "130535": "\u4E34\u897F\u53BF",
    "130571": "\u6CB3\u5317\u90A2\u53F0\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "130581": "\u5357\u5BAB\u5E02",
    "130582": "\u6C99\u6CB3\u5E02"
  },
  "130600": {
    "130601": "\u5E02\u8F96\u533A",
    "130602": "\u7ADE\u79C0\u533A",
    "130606": "\u83B2\u6C60\u533A",
    "130607": "\u6EE1\u57CE\u533A",
    "130608": "\u6E05\u82D1\u533A",
    "130609": "\u5F90\u6C34\u533A",
    "130623": "\u6D9E\u6C34\u53BF",
    "130624": "\u961C\u5E73\u53BF",
    "130626": "\u5B9A\u5174\u53BF",
    "130627": "\u5510\u53BF",
    "130628": "\u9AD8\u9633\u53BF",
    "130629": "\u5BB9\u57CE\u53BF",
    "130630": "\u6D9E\u6E90\u53BF",
    "130631": "\u671B\u90FD\u53BF",
    "130632": "\u5B89\u65B0\u53BF",
    "130633": "\u6613\u53BF",
    "130634": "\u66F2\u9633\u53BF",
    "130635": "\u8821\u53BF",
    "130636": "\u987A\u5E73\u53BF",
    "130637": "\u535A\u91CE\u53BF",
    "130638": "\u96C4\u53BF",
    "130671": "\u4FDD\u5B9A\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "130672": "\u4FDD\u5B9A\u767D\u6C9F\u65B0\u57CE",
    "130681": "\u6DBF\u5DDE\u5E02",
    "130682": "\u5B9A\u5DDE\u5E02",
    "130683": "\u5B89\u56FD\u5E02",
    "130684": "\u9AD8\u7891\u5E97\u5E02"
  },
  "130700": {
    "130701": "\u5E02\u8F96\u533A",
    "130702": "\u6865\u4E1C\u533A",
    "130703": "\u6865\u897F\u533A",
    "130705": "\u5BA3\u5316\u533A",
    "130706": "\u4E0B\u82B1\u56ED\u533A",
    "130708": "\u4E07\u5168\u533A",
    "130709": "\u5D07\u793C\u533A",
    "130722": "\u5F20\u5317\u53BF",
    "130723": "\u5EB7\u4FDD\u53BF",
    "130724": "\u6CBD\u6E90\u53BF",
    "130725": "\u5C1A\u4E49\u53BF",
    "130726": "\u851A\u53BF",
    "130727": "\u9633\u539F\u53BF",
    "130728": "\u6000\u5B89\u53BF",
    "130730": "\u6000\u6765\u53BF",
    "130731": "\u6DBF\u9E7F\u53BF",
    "130732": "\u8D64\u57CE\u53BF",
    "130771": "\u5F20\u5BB6\u53E3\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "130772": "\u5F20\u5BB6\u53E3\u5E02\u5BDF\u5317\u7BA1\u7406\u533A",
    "130773": "\u5F20\u5BB6\u53E3\u5E02\u585E\u5317\u7BA1\u7406\u533A"
  },
  "130800": {
    "130801": "\u5E02\u8F96\u533A",
    "130802": "\u53CC\u6865\u533A",
    "130803": "\u53CC\u6EE6\u533A",
    "130804": "\u9E70\u624B\u8425\u5B50\u77FF\u533A",
    "130821": "\u627F\u5FB7\u53BF",
    "130822": "\u5174\u9686\u53BF",
    "130824": "\u6EE6\u5E73\u53BF",
    "130825": "\u9686\u5316\u53BF",
    "130826": "\u4E30\u5B81\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "130827": "\u5BBD\u57CE\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "130828": "\u56F4\u573A\u6EE1\u65CF\u8499\u53E4\u65CF\u81EA\u6CBB\u53BF",
    "130871": "\u627F\u5FB7\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "130881": "\u5E73\u6CC9\u5E02"
  },
  "130900": {
    "130901": "\u5E02\u8F96\u533A",
    "130902": "\u65B0\u534E\u533A",
    "130903": "\u8FD0\u6CB3\u533A",
    "130921": "\u6CA7\u53BF",
    "130922": "\u9752\u53BF",
    "130923": "\u4E1C\u5149\u53BF",
    "130924": "\u6D77\u5174\u53BF",
    "130925": "\u76D0\u5C71\u53BF",
    "130926": "\u8083\u5B81\u53BF",
    "130927": "\u5357\u76AE\u53BF",
    "130928": "\u5434\u6865\u53BF",
    "130929": "\u732E\u53BF",
    "130930": "\u5B5F\u6751\u56DE\u65CF\u81EA\u6CBB\u53BF",
    "130971": "\u6CB3\u5317\u6CA7\u5DDE\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "130972": "\u6CA7\u5DDE\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "130973": "\u6CA7\u5DDE\u6E24\u6D77\u65B0\u533A",
    "130981": "\u6CCA\u5934\u5E02",
    "130982": "\u4EFB\u4E18\u5E02",
    "130983": "\u9EC4\u9A85\u5E02",
    "130984": "\u6CB3\u95F4\u5E02"
  },
  "131000": {
    "131001": "\u5E02\u8F96\u533A",
    "131002": "\u5B89\u6B21\u533A",
    "131003": "\u5E7F\u9633\u533A",
    "131022": "\u56FA\u5B89\u53BF",
    "131023": "\u6C38\u6E05\u53BF",
    "131024": "\u9999\u6CB3\u53BF",
    "131025": "\u5927\u57CE\u53BF",
    "131026": "\u6587\u5B89\u53BF",
    "131028": "\u5927\u5382\u56DE\u65CF\u81EA\u6CBB\u53BF",
    "131071": "\u5ECA\u574A\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "131081": "\u9738\u5DDE\u5E02",
    "131082": "\u4E09\u6CB3\u5E02"
  },
  "131100": {
    "131101": "\u5E02\u8F96\u533A",
    "131102": "\u6843\u57CE\u533A",
    "131103": "\u5180\u5DDE\u533A",
    "131121": "\u67A3\u5F3A\u53BF",
    "131122": "\u6B66\u9091\u53BF",
    "131123": "\u6B66\u5F3A\u53BF",
    "131124": "\u9976\u9633\u53BF",
    "131125": "\u5B89\u5E73\u53BF",
    "131126": "\u6545\u57CE\u53BF",
    "131127": "\u666F\u53BF",
    "131128": "\u961C\u57CE\u53BF",
    "131171": "\u6CB3\u5317\u8861\u6C34\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "131172": "\u8861\u6C34\u6EE8\u6E56\u65B0\u533A",
    "131182": "\u6DF1\u5DDE\u5E02"
  },
  "140000": {
    "140100": "\u592A\u539F\u5E02",
    "140200": "\u5927\u540C\u5E02",
    "140300": "\u9633\u6CC9\u5E02",
    "140400": "\u957F\u6CBB\u5E02",
    "140500": "\u664B\u57CE\u5E02",
    "140600": "\u6714\u5DDE\u5E02",
    "140700": "\u664B\u4E2D\u5E02",
    "140800": "\u8FD0\u57CE\u5E02",
    "140900": "\u5FFB\u5DDE\u5E02",
    "141000": "\u4E34\u6C7E\u5E02",
    "141100": "\u5415\u6881\u5E02"
  },
  "140100": {
    "140101": "\u5E02\u8F96\u533A",
    "140105": "\u5C0F\u5E97\u533A",
    "140106": "\u8FCE\u6CFD\u533A",
    "140107": "\u674F\u82B1\u5CAD\u533A",
    "140108": "\u5C16\u8349\u576A\u533A",
    "140109": "\u4E07\u67CF\u6797\u533A",
    "140110": "\u664B\u6E90\u533A",
    "140121": "\u6E05\u5F90\u53BF",
    "140122": "\u9633\u66F2\u53BF",
    "140123": "\u5A04\u70E6\u53BF",
    "140171": "\u5C71\u897F\u8F6C\u578B\u7EFC\u5408\u6539\u9769\u793A\u8303\u533A",
    "140181": "\u53E4\u4EA4\u5E02"
  },
  "140200": {
    "140201": "\u5E02\u8F96\u533A",
    "140212": "\u65B0\u8363\u533A",
    "140213": "\u5E73\u57CE\u533A",
    "140214": "\u4E91\u5188\u533A",
    "140215": "\u4E91\u5DDE\u533A",
    "140221": "\u9633\u9AD8\u53BF",
    "140222": "\u5929\u9547\u53BF",
    "140223": "\u5E7F\u7075\u53BF",
    "140224": "\u7075\u4E18\u53BF",
    "140225": "\u6D51\u6E90\u53BF",
    "140226": "\u5DE6\u4E91\u53BF",
    "140271": "\u5C71\u897F\u5927\u540C\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "140300": {
    "140301": "\u5E02\u8F96\u533A",
    "140302": "\u57CE\u533A",
    "140303": "\u77FF\u533A",
    "140311": "\u90CA\u533A",
    "140321": "\u5E73\u5B9A\u53BF",
    "140322": "\u76C2\u53BF"
  },
  "140400": {
    "140401": "\u5E02\u8F96\u533A",
    "140403": "\u6F5E\u5DDE\u533A",
    "140404": "\u4E0A\u515A\u533A",
    "140405": "\u5C6F\u7559\u533A",
    "140406": "\u6F5E\u57CE\u533A",
    "140423": "\u8944\u57A3\u53BF",
    "140425": "\u5E73\u987A\u53BF",
    "140426": "\u9ECE\u57CE\u53BF",
    "140427": "\u58F6\u5173\u53BF",
    "140428": "\u957F\u5B50\u53BF",
    "140429": "\u6B66\u4E61\u53BF",
    "140430": "\u6C81\u53BF",
    "140431": "\u6C81\u6E90\u53BF",
    "140471": "\u5C71\u897F\u957F\u6CBB\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u56ED\u533A"
  },
  "140500": {
    "140501": "\u5E02\u8F96\u533A",
    "140502": "\u57CE\u533A",
    "140521": "\u6C81\u6C34\u53BF",
    "140522": "\u9633\u57CE\u53BF",
    "140524": "\u9675\u5DDD\u53BF",
    "140525": "\u6CFD\u5DDE\u53BF",
    "140581": "\u9AD8\u5E73\u5E02"
  },
  "140600": {
    "140601": "\u5E02\u8F96\u533A",
    "140602": "\u6714\u57CE\u533A",
    "140603": "\u5E73\u9C81\u533A",
    "140621": "\u5C71\u9634\u53BF",
    "140622": "\u5E94\u53BF",
    "140623": "\u53F3\u7389\u53BF",
    "140671": "\u5C71\u897F\u6714\u5DDE\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "140681": "\u6000\u4EC1\u5E02"
  },
  "140700": {
    "140701": "\u5E02\u8F96\u533A",
    "140702": "\u6986\u6B21\u533A",
    "140721": "\u6986\u793E\u53BF",
    "140722": "\u5DE6\u6743\u53BF",
    "140723": "\u548C\u987A\u53BF",
    "140724": "\u6614\u9633\u53BF",
    "140725": "\u5BFF\u9633\u53BF",
    "140726": "\u592A\u8C37\u53BF",
    "140727": "\u7941\u53BF",
    "140728": "\u5E73\u9065\u53BF",
    "140729": "\u7075\u77F3\u53BF",
    "140781": "\u4ECB\u4F11\u5E02"
  },
  "140800": {
    "140801": "\u5E02\u8F96\u533A",
    "140802": "\u76D0\u6E56\u533A",
    "140821": "\u4E34\u7317\u53BF",
    "140822": "\u4E07\u8363\u53BF",
    "140823": "\u95FB\u559C\u53BF",
    "140824": "\u7A37\u5C71\u53BF",
    "140825": "\u65B0\u7EDB\u53BF",
    "140826": "\u7EDB\u53BF",
    "140827": "\u57A3\u66F2\u53BF",
    "140828": "\u590F\u53BF",
    "140829": "\u5E73\u9646\u53BF",
    "140830": "\u82AE\u57CE\u53BF",
    "140881": "\u6C38\u6D4E\u5E02",
    "140882": "\u6CB3\u6D25\u5E02"
  },
  "140900": {
    "140901": "\u5E02\u8F96\u533A",
    "140902": "\u5FFB\u5E9C\u533A",
    "140921": "\u5B9A\u8944\u53BF",
    "140922": "\u4E94\u53F0\u53BF",
    "140923": "\u4EE3\u53BF",
    "140924": "\u7E41\u5CD9\u53BF",
    "140925": "\u5B81\u6B66\u53BF",
    "140926": "\u9759\u4E50\u53BF",
    "140927": "\u795E\u6C60\u53BF",
    "140928": "\u4E94\u5BE8\u53BF",
    "140929": "\u5CA2\u5C9A\u53BF",
    "140930": "\u6CB3\u66F2\u53BF",
    "140931": "\u4FDD\u5FB7\u53BF",
    "140932": "\u504F\u5173\u53BF",
    "140971": "\u4E94\u53F0\u5C71\u98CE\u666F\u540D\u80DC\u533A",
    "140981": "\u539F\u5E73\u5E02"
  },
  "141000": {
    "141001": "\u5E02\u8F96\u533A",
    "141002": "\u5C27\u90FD\u533A",
    "141021": "\u66F2\u6C83\u53BF",
    "141022": "\u7FFC\u57CE\u53BF",
    "141023": "\u8944\u6C7E\u53BF",
    "141024": "\u6D2A\u6D1E\u53BF",
    "141025": "\u53E4\u53BF",
    "141026": "\u5B89\u6CFD\u53BF",
    "141027": "\u6D6E\u5C71\u53BF",
    "141028": "\u5409\u53BF",
    "141029": "\u4E61\u5B81\u53BF",
    "141030": "\u5927\u5B81\u53BF",
    "141031": "\u96B0\u53BF",
    "141032": "\u6C38\u548C\u53BF",
    "141033": "\u84B2\u53BF",
    "141034": "\u6C7E\u897F\u53BF",
    "141081": "\u4FAF\u9A6C\u5E02",
    "141082": "\u970D\u5DDE\u5E02"
  },
  "141100": {
    "141101": "\u5E02\u8F96\u533A",
    "141102": "\u79BB\u77F3\u533A",
    "141121": "\u6587\u6C34\u53BF",
    "141122": "\u4EA4\u57CE\u53BF",
    "141123": "\u5174\u53BF",
    "141124": "\u4E34\u53BF",
    "141125": "\u67F3\u6797\u53BF",
    "141126": "\u77F3\u697C\u53BF",
    "141127": "\u5C9A\u53BF",
    "141128": "\u65B9\u5C71\u53BF",
    "141129": "\u4E2D\u9633\u53BF",
    "141130": "\u4EA4\u53E3\u53BF",
    "141181": "\u5B5D\u4E49\u5E02",
    "141182": "\u6C7E\u9633\u5E02"
  },
  "150000": {
    "150100": "\u547C\u548C\u6D69\u7279\u5E02",
    "150200": "\u5305\u5934\u5E02",
    "150300": "\u4E4C\u6D77\u5E02",
    "150400": "\u8D64\u5CF0\u5E02",
    "150500": "\u901A\u8FBD\u5E02",
    "150600": "\u9102\u5C14\u591A\u65AF\u5E02",
    "150700": "\u547C\u4F26\u8D1D\u5C14\u5E02",
    "150800": "\u5DF4\u5F66\u6DD6\u5C14\u5E02",
    "150900": "\u4E4C\u5170\u5BDF\u5E03\u5E02",
    "152200": "\u5174\u5B89\u76DF",
    "152500": "\u9521\u6797\u90ED\u52D2\u76DF",
    "152900": "\u963F\u62C9\u5584\u76DF"
  },
  "150100": {
    "150101": "\u5E02\u8F96\u533A",
    "150102": "\u65B0\u57CE\u533A",
    "150103": "\u56DE\u6C11\u533A",
    "150104": "\u7389\u6CC9\u533A",
    "150105": "\u8D5B\u7F55\u533A",
    "150121": "\u571F\u9ED8\u7279\u5DE6\u65D7",
    "150122": "\u6258\u514B\u6258\u53BF",
    "150123": "\u548C\u6797\u683C\u5C14\u53BF",
    "150124": "\u6E05\u6C34\u6CB3\u53BF",
    "150125": "\u6B66\u5DDD\u53BF",
    "150171": "\u547C\u548C\u6D69\u7279\u91D1\u6D77\u5DE5\u4E1A\u56ED\u533A",
    "150172": "\u547C\u548C\u6D69\u7279\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "150200": {
    "150201": "\u5E02\u8F96\u533A",
    "150202": "\u4E1C\u6CB3\u533A",
    "150203": "\u6606\u90FD\u4ED1\u533A",
    "150204": "\u9752\u5C71\u533A",
    "150205": "\u77F3\u62D0\u533A",
    "150206": "\u767D\u4E91\u9102\u535A\u77FF\u533A",
    "150207": "\u4E5D\u539F\u533A",
    "150221": "\u571F\u9ED8\u7279\u53F3\u65D7",
    "150222": "\u56FA\u9633\u53BF",
    "150223": "\u8FBE\u5C14\u7F55\u8302\u660E\u5B89\u8054\u5408\u65D7",
    "150271": "\u5305\u5934\u7A00\u571F\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A"
  },
  "150300": {
    "150301": "\u5E02\u8F96\u533A",
    "150302": "\u6D77\u52C3\u6E7E\u533A",
    "150303": "\u6D77\u5357\u533A",
    "150304": "\u4E4C\u8FBE\u533A"
  },
  "150400": {
    "150401": "\u5E02\u8F96\u533A",
    "150402": "\u7EA2\u5C71\u533A",
    "150403": "\u5143\u5B9D\u5C71\u533A",
    "150404": "\u677E\u5C71\u533A",
    "150421": "\u963F\u9C81\u79D1\u5C14\u6C81\u65D7",
    "150422": "\u5DF4\u6797\u5DE6\u65D7",
    "150423": "\u5DF4\u6797\u53F3\u65D7",
    "150424": "\u6797\u897F\u53BF",
    "150425": "\u514B\u4EC0\u514B\u817E\u65D7",
    "150426": "\u7FC1\u725B\u7279\u65D7",
    "150428": "\u5580\u5587\u6C81\u65D7",
    "150429": "\u5B81\u57CE\u53BF",
    "150430": "\u6556\u6C49\u65D7"
  },
  "150500": {
    "150501": "\u5E02\u8F96\u533A",
    "150502": "\u79D1\u5C14\u6C81\u533A",
    "150521": "\u79D1\u5C14\u6C81\u5DE6\u7FFC\u4E2D\u65D7",
    "150522": "\u79D1\u5C14\u6C81\u5DE6\u7FFC\u540E\u65D7",
    "150523": "\u5F00\u9C81\u53BF",
    "150524": "\u5E93\u4F26\u65D7",
    "150525": "\u5948\u66FC\u65D7",
    "150526": "\u624E\u9C81\u7279\u65D7",
    "150571": "\u901A\u8FBD\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "150581": "\u970D\u6797\u90ED\u52D2\u5E02"
  },
  "150600": {
    "150601": "\u5E02\u8F96\u533A",
    "150602": "\u4E1C\u80DC\u533A",
    "150603": "\u5EB7\u5DF4\u4EC0\u533A",
    "150621": "\u8FBE\u62C9\u7279\u65D7",
    "150622": "\u51C6\u683C\u5C14\u65D7",
    "150623": "\u9102\u6258\u514B\u524D\u65D7",
    "150624": "\u9102\u6258\u514B\u65D7",
    "150625": "\u676D\u9526\u65D7",
    "150626": "\u4E4C\u5BA1\u65D7",
    "150627": "\u4F0A\u91D1\u970D\u6D1B\u65D7"
  },
  "150700": {
    "150701": "\u5E02\u8F96\u533A",
    "150702": "\u6D77\u62C9\u5C14\u533A",
    "150703": "\u624E\u8D49\u8BFA\u5C14\u533A",
    "150721": "\u963F\u8363\u65D7",
    "150722": "\u83AB\u529B\u8FBE\u74E6\u8FBE\u65A1\u5C14\u65CF\u81EA\u6CBB\u65D7",
    "150723": "\u9102\u4F26\u6625\u81EA\u6CBB\u65D7",
    "150724": "\u9102\u6E29\u514B\u65CF\u81EA\u6CBB\u65D7",
    "150725": "\u9648\u5DF4\u5C14\u864E\u65D7",
    "150726": "\u65B0\u5DF4\u5C14\u864E\u5DE6\u65D7",
    "150727": "\u65B0\u5DF4\u5C14\u864E\u53F3\u65D7",
    "150781": "\u6EE1\u6D32\u91CC\u5E02",
    "150782": "\u7259\u514B\u77F3\u5E02",
    "150783": "\u624E\u5170\u5C6F\u5E02",
    "150784": "\u989D\u5C14\u53E4\u7EB3\u5E02",
    "150785": "\u6839\u6CB3\u5E02"
  },
  "150800": {
    "150801": "\u5E02\u8F96\u533A",
    "150802": "\u4E34\u6CB3\u533A",
    "150821": "\u4E94\u539F\u53BF",
    "150822": "\u78F4\u53E3\u53BF",
    "150823": "\u4E4C\u62C9\u7279\u524D\u65D7",
    "150824": "\u4E4C\u62C9\u7279\u4E2D\u65D7",
    "150825": "\u4E4C\u62C9\u7279\u540E\u65D7",
    "150826": "\u676D\u9526\u540E\u65D7"
  },
  "150900": {
    "150901": "\u5E02\u8F96\u533A",
    "150902": "\u96C6\u5B81\u533A",
    "150921": "\u5353\u8D44\u53BF",
    "150922": "\u5316\u5FB7\u53BF",
    "150923": "\u5546\u90FD\u53BF",
    "150924": "\u5174\u548C\u53BF",
    "150925": "\u51C9\u57CE\u53BF",
    "150926": "\u5BDF\u54C8\u5C14\u53F3\u7FFC\u524D\u65D7",
    "150927": "\u5BDF\u54C8\u5C14\u53F3\u7FFC\u4E2D\u65D7",
    "150928": "\u5BDF\u54C8\u5C14\u53F3\u7FFC\u540E\u65D7",
    "150929": "\u56DB\u5B50\u738B\u65D7",
    "150981": "\u4E30\u9547\u5E02"
  },
  "152200": {
    "152201": "\u4E4C\u5170\u6D69\u7279\u5E02",
    "152202": "\u963F\u5C14\u5C71\u5E02",
    "152221": "\u79D1\u5C14\u6C81\u53F3\u7FFC\u524D\u65D7",
    "152222": "\u79D1\u5C14\u6C81\u53F3\u7FFC\u4E2D\u65D7",
    "152223": "\u624E\u8D49\u7279\u65D7",
    "152224": "\u7A81\u6CC9\u53BF"
  },
  "152500": {
    "152501": "\u4E8C\u8FDE\u6D69\u7279\u5E02",
    "152502": "\u9521\u6797\u6D69\u7279\u5E02",
    "152522": "\u963F\u5DF4\u560E\u65D7",
    "152523": "\u82CF\u5C3C\u7279\u5DE6\u65D7",
    "152524": "\u82CF\u5C3C\u7279\u53F3\u65D7",
    "152525": "\u4E1C\u4E4C\u73E0\u7A46\u6C81\u65D7",
    "152526": "\u897F\u4E4C\u73E0\u7A46\u6C81\u65D7",
    "152527": "\u592A\u4EC6\u5BFA\u65D7",
    "152528": "\u9576\u9EC4\u65D7",
    "152529": "\u6B63\u9576\u767D\u65D7",
    "152530": "\u6B63\u84DD\u65D7",
    "152531": "\u591A\u4F26\u53BF",
    "152571": "\u4E4C\u62C9\u76D6\u7BA1\u59D4\u4F1A"
  },
  "152900": {
    "152921": "\u963F\u62C9\u5584\u5DE6\u65D7",
    "152922": "\u963F\u62C9\u5584\u53F3\u65D7",
    "152923": "\u989D\u6D4E\u7EB3\u65D7",
    "152971": "\u5185\u8499\u53E4\u963F\u62C9\u5584\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "210000": {
    "210100": "\u6C88\u9633\u5E02",
    "210200": "\u5927\u8FDE\u5E02",
    "210300": "\u978D\u5C71\u5E02",
    "210400": "\u629A\u987A\u5E02",
    "210500": "\u672C\u6EAA\u5E02",
    "210600": "\u4E39\u4E1C\u5E02",
    "210700": "\u9526\u5DDE\u5E02",
    "210800": "\u8425\u53E3\u5E02",
    "210900": "\u961C\u65B0\u5E02",
    "211000": "\u8FBD\u9633\u5E02",
    "211100": "\u76D8\u9526\u5E02",
    "211200": "\u94C1\u5CAD\u5E02",
    "211300": "\u671D\u9633\u5E02",
    "211400": "\u846B\u82A6\u5C9B\u5E02"
  },
  "210100": {
    "210101": "\u5E02\u8F96\u533A",
    "210102": "\u548C\u5E73\u533A",
    "210103": "\u6C88\u6CB3\u533A",
    "210104": "\u5927\u4E1C\u533A",
    "210105": "\u7687\u59D1\u533A",
    "210106": "\u94C1\u897F\u533A",
    "210111": "\u82CF\u5BB6\u5C6F\u533A",
    "210112": "\u6D51\u5357\u533A",
    "210113": "\u6C88\u5317\u65B0\u533A",
    "210114": "\u4E8E\u6D2A\u533A",
    "210115": "\u8FBD\u4E2D\u533A",
    "210123": "\u5EB7\u5E73\u53BF",
    "210124": "\u6CD5\u5E93\u53BF",
    "210181": "\u65B0\u6C11\u5E02"
  },
  "210200": {
    "210201": "\u5E02\u8F96\u533A",
    "210202": "\u4E2D\u5C71\u533A",
    "210203": "\u897F\u5C97\u533A",
    "210204": "\u6C99\u6CB3\u53E3\u533A",
    "210211": "\u7518\u4E95\u5B50\u533A",
    "210212": "\u65C5\u987A\u53E3\u533A",
    "210213": "\u91D1\u5DDE\u533A",
    "210214": "\u666E\u5170\u5E97\u533A",
    "210224": "\u957F\u6D77\u53BF",
    "210281": "\u74E6\u623F\u5E97\u5E02",
    "210283": "\u5E84\u6CB3\u5E02"
  },
  "210300": {
    "210301": "\u5E02\u8F96\u533A",
    "210302": "\u94C1\u4E1C\u533A",
    "210303": "\u94C1\u897F\u533A",
    "210304": "\u7ACB\u5C71\u533A",
    "210311": "\u5343\u5C71\u533A",
    "210321": "\u53F0\u5B89\u53BF",
    "210323": "\u5CAB\u5CA9\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "210381": "\u6D77\u57CE\u5E02"
  },
  "210400": {
    "210401": "\u5E02\u8F96\u533A",
    "210402": "\u65B0\u629A\u533A",
    "210403": "\u4E1C\u6D32\u533A",
    "210404": "\u671B\u82B1\u533A",
    "210411": "\u987A\u57CE\u533A",
    "210421": "\u629A\u987A\u53BF",
    "210422": "\u65B0\u5BBE\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "210423": "\u6E05\u539F\u6EE1\u65CF\u81EA\u6CBB\u53BF"
  },
  "210500": {
    "210501": "\u5E02\u8F96\u533A",
    "210502": "\u5E73\u5C71\u533A",
    "210503": "\u6EAA\u6E56\u533A",
    "210504": "\u660E\u5C71\u533A",
    "210505": "\u5357\u82AC\u533A",
    "210521": "\u672C\u6EAA\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "210522": "\u6853\u4EC1\u6EE1\u65CF\u81EA\u6CBB\u53BF"
  },
  "210600": {
    "210601": "\u5E02\u8F96\u533A",
    "210602": "\u5143\u5B9D\u533A",
    "210603": "\u632F\u5174\u533A",
    "210604": "\u632F\u5B89\u533A",
    "210624": "\u5BBD\u7538\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "210681": "\u4E1C\u6E2F\u5E02",
    "210682": "\u51E4\u57CE\u5E02"
  },
  "210700": {
    "210701": "\u5E02\u8F96\u533A",
    "210702": "\u53E4\u5854\u533A",
    "210703": "\u51CC\u6CB3\u533A",
    "210711": "\u592A\u548C\u533A",
    "210726": "\u9ED1\u5C71\u53BF",
    "210727": "\u4E49\u53BF",
    "210781": "\u51CC\u6D77\u5E02",
    "210782": "\u5317\u9547\u5E02"
  },
  "210800": {
    "210801": "\u5E02\u8F96\u533A",
    "210802": "\u7AD9\u524D\u533A",
    "210803": "\u897F\u5E02\u533A",
    "210804": "\u9C85\u9C7C\u5708\u533A",
    "210811": "\u8001\u8FB9\u533A",
    "210881": "\u76D6\u5DDE\u5E02",
    "210882": "\u5927\u77F3\u6865\u5E02"
  },
  "210900": {
    "210901": "\u5E02\u8F96\u533A",
    "210902": "\u6D77\u5DDE\u533A",
    "210903": "\u65B0\u90B1\u533A",
    "210904": "\u592A\u5E73\u533A",
    "210905": "\u6E05\u6CB3\u95E8\u533A",
    "210911": "\u7EC6\u6CB3\u533A",
    "210921": "\u961C\u65B0\u8499\u53E4\u65CF\u81EA\u6CBB\u53BF",
    "210922": "\u5F70\u6B66\u53BF"
  },
  "211000": {
    "211001": "\u5E02\u8F96\u533A",
    "211002": "\u767D\u5854\u533A",
    "211003": "\u6587\u5723\u533A",
    "211004": "\u5B8F\u4F1F\u533A",
    "211005": "\u5F13\u957F\u5CAD\u533A",
    "211011": "\u592A\u5B50\u6CB3\u533A",
    "211021": "\u8FBD\u9633\u53BF",
    "211081": "\u706F\u5854\u5E02"
  },
  "211100": {
    "211101": "\u5E02\u8F96\u533A",
    "211102": "\u53CC\u53F0\u5B50\u533A",
    "211103": "\u5174\u9686\u53F0\u533A",
    "211104": "\u5927\u6D3C\u533A",
    "211122": "\u76D8\u5C71\u53BF"
  },
  "211200": {
    "211201": "\u5E02\u8F96\u533A",
    "211202": "\u94F6\u5DDE\u533A",
    "211204": "\u6E05\u6CB3\u533A",
    "211221": "\u94C1\u5CAD\u53BF",
    "211223": "\u897F\u4E30\u53BF",
    "211224": "\u660C\u56FE\u53BF",
    "211281": "\u8C03\u5175\u5C71\u5E02",
    "211282": "\u5F00\u539F\u5E02"
  },
  "211300": {
    "211301": "\u5E02\u8F96\u533A",
    "211302": "\u53CC\u5854\u533A",
    "211303": "\u9F99\u57CE\u533A",
    "211321": "\u671D\u9633\u53BF",
    "211322": "\u5EFA\u5E73\u53BF",
    "211324": "\u5580\u5587\u6C81\u5DE6\u7FFC\u8499\u53E4\u65CF\u81EA\u6CBB\u53BF",
    "211381": "\u5317\u7968\u5E02",
    "211382": "\u51CC\u6E90\u5E02"
  },
  "211400": {
    "211401": "\u5E02\u8F96\u533A",
    "211402": "\u8FDE\u5C71\u533A",
    "211403": "\u9F99\u6E2F\u533A",
    "211404": "\u5357\u7968\u533A",
    "211421": "\u7EE5\u4E2D\u53BF",
    "211422": "\u5EFA\u660C\u53BF",
    "211481": "\u5174\u57CE\u5E02"
  },
  "220000": {
    "220100": "\u957F\u6625\u5E02",
    "220200": "\u5409\u6797\u5E02",
    "220300": "\u56DB\u5E73\u5E02",
    "220400": "\u8FBD\u6E90\u5E02",
    "220500": "\u901A\u5316\u5E02",
    "220600": "\u767D\u5C71\u5E02",
    "220700": "\u677E\u539F\u5E02",
    "220800": "\u767D\u57CE\u5E02",
    "222400": "\u5EF6\u8FB9\u671D\u9C9C\u65CF\u81EA\u6CBB\u5DDE"
  },
  "220100": {
    "220101": "\u5E02\u8F96\u533A",
    "220102": "\u5357\u5173\u533A",
    "220103": "\u5BBD\u57CE\u533A",
    "220104": "\u671D\u9633\u533A",
    "220105": "\u4E8C\u9053\u533A",
    "220106": "\u7EFF\u56ED\u533A",
    "220112": "\u53CC\u9633\u533A",
    "220113": "\u4E5D\u53F0\u533A",
    "220122": "\u519C\u5B89\u53BF",
    "220171": "\u957F\u6625\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "220172": "\u957F\u6625\u51C0\u6708\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "220173": "\u957F\u6625\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "220174": "\u957F\u6625\u6C7D\u8F66\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "220182": "\u6986\u6811\u5E02",
    "220183": "\u5FB7\u60E0\u5E02"
  },
  "220200": {
    "220201": "\u5E02\u8F96\u533A",
    "220202": "\u660C\u9091\u533A",
    "220203": "\u9F99\u6F6D\u533A",
    "220204": "\u8239\u8425\u533A",
    "220211": "\u4E30\u6EE1\u533A",
    "220221": "\u6C38\u5409\u53BF",
    "220271": "\u5409\u6797\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "220272": "\u5409\u6797\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "220273": "\u5409\u6797\u4E2D\u56FD\u65B0\u52A0\u5761\u98DF\u54C1\u533A",
    "220281": "\u86DF\u6CB3\u5E02",
    "220282": "\u6866\u7538\u5E02",
    "220283": "\u8212\u5170\u5E02",
    "220284": "\u78D0\u77F3\u5E02"
  },
  "220300": {
    "220301": "\u5E02\u8F96\u533A",
    "220302": "\u94C1\u897F\u533A",
    "220303": "\u94C1\u4E1C\u533A",
    "220322": "\u68A8\u6811\u53BF",
    "220323": "\u4F0A\u901A\u6EE1\u65CF\u81EA\u6CBB\u53BF",
    "220381": "\u516C\u4E3B\u5CAD\u5E02",
    "220382": "\u53CC\u8FBD\u5E02"
  },
  "220400": {
    "220401": "\u5E02\u8F96\u533A",
    "220402": "\u9F99\u5C71\u533A",
    "220403": "\u897F\u5B89\u533A",
    "220421": "\u4E1C\u4E30\u53BF",
    "220422": "\u4E1C\u8FBD\u53BF"
  },
  "220500": {
    "220501": "\u5E02\u8F96\u533A",
    "220502": "\u4E1C\u660C\u533A",
    "220503": "\u4E8C\u9053\u6C5F\u533A",
    "220521": "\u901A\u5316\u53BF",
    "220523": "\u8F89\u5357\u53BF",
    "220524": "\u67F3\u6CB3\u53BF",
    "220581": "\u6885\u6CB3\u53E3\u5E02",
    "220582": "\u96C6\u5B89\u5E02"
  },
  "220600": {
    "220601": "\u5E02\u8F96\u533A",
    "220602": "\u6D51\u6C5F\u533A",
    "220605": "\u6C5F\u6E90\u533A",
    "220621": "\u629A\u677E\u53BF",
    "220622": "\u9756\u5B87\u53BF",
    "220623": "\u957F\u767D\u671D\u9C9C\u65CF\u81EA\u6CBB\u53BF",
    "220681": "\u4E34\u6C5F\u5E02"
  },
  "220700": {
    "220701": "\u5E02\u8F96\u533A",
    "220702": "\u5B81\u6C5F\u533A",
    "220721": "\u524D\u90ED\u5C14\u7F57\u65AF\u8499\u53E4\u65CF\u81EA\u6CBB\u53BF",
    "220722": "\u957F\u5CAD\u53BF",
    "220723": "\u4E7E\u5B89\u53BF",
    "220771": "\u5409\u6797\u677E\u539F\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "220781": "\u6276\u4F59\u5E02"
  },
  "220800": {
    "220801": "\u5E02\u8F96\u533A",
    "220802": "\u6D2E\u5317\u533A",
    "220821": "\u9547\u8D49\u53BF",
    "220822": "\u901A\u6986\u53BF",
    "220871": "\u5409\u6797\u767D\u57CE\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "220881": "\u6D2E\u5357\u5E02",
    "220882": "\u5927\u5B89\u5E02"
  },
  "222400": {
    "222401": "\u5EF6\u5409\u5E02",
    "222402": "\u56FE\u4EEC\u5E02",
    "222403": "\u6566\u5316\u5E02",
    "222404": "\u73F2\u6625\u5E02",
    "222405": "\u9F99\u4E95\u5E02",
    "222406": "\u548C\u9F99\u5E02",
    "222424": "\u6C6A\u6E05\u53BF",
    "222426": "\u5B89\u56FE\u53BF"
  },
  "230000": {
    "230100": "\u54C8\u5C14\u6EE8\u5E02",
    "230200": "\u9F50\u9F50\u54C8\u5C14\u5E02",
    "230300": "\u9E21\u897F\u5E02",
    "230400": "\u9E64\u5C97\u5E02",
    "230500": "\u53CC\u9E2D\u5C71\u5E02",
    "230600": "\u5927\u5E86\u5E02",
    "230700": "\u4F0A\u6625\u5E02",
    "230800": "\u4F73\u6728\u65AF\u5E02",
    "230900": "\u4E03\u53F0\u6CB3\u5E02",
    "231000": "\u7261\u4E39\u6C5F\u5E02",
    "231100": "\u9ED1\u6CB3\u5E02",
    "231200": "\u7EE5\u5316\u5E02",
    "232700": "\u5927\u5174\u5B89\u5CAD\u5730\u533A"
  },
  "230100": {
    "230101": "\u5E02\u8F96\u533A",
    "230102": "\u9053\u91CC\u533A",
    "230103": "\u5357\u5C97\u533A",
    "230104": "\u9053\u5916\u533A",
    "230108": "\u5E73\u623F\u533A",
    "230109": "\u677E\u5317\u533A",
    "230110": "\u9999\u574A\u533A",
    "230111": "\u547C\u5170\u533A",
    "230112": "\u963F\u57CE\u533A",
    "230113": "\u53CC\u57CE\u533A",
    "230123": "\u4F9D\u5170\u53BF",
    "230124": "\u65B9\u6B63\u53BF",
    "230125": "\u5BBE\u53BF",
    "230126": "\u5DF4\u5F66\u53BF",
    "230127": "\u6728\u5170\u53BF",
    "230128": "\u901A\u6CB3\u53BF",
    "230129": "\u5EF6\u5BFF\u53BF",
    "230183": "\u5C1A\u5FD7\u5E02",
    "230184": "\u4E94\u5E38\u5E02"
  },
  "230200": {
    "230201": "\u5E02\u8F96\u533A",
    "230202": "\u9F99\u6C99\u533A",
    "230203": "\u5EFA\u534E\u533A",
    "230204": "\u94C1\u950B\u533A",
    "230205": "\u6602\u6602\u6EAA\u533A",
    "230206": "\u5BCC\u62C9\u5C14\u57FA\u533A",
    "230207": "\u78BE\u5B50\u5C71\u533A",
    "230208": "\u6885\u91CC\u65AF\u8FBE\u65A1\u5C14\u65CF\u533A",
    "230221": "\u9F99\u6C5F\u53BF",
    "230223": "\u4F9D\u5B89\u53BF",
    "230224": "\u6CF0\u6765\u53BF",
    "230225": "\u7518\u5357\u53BF",
    "230227": "\u5BCC\u88D5\u53BF",
    "230229": "\u514B\u5C71\u53BF",
    "230230": "\u514B\u4E1C\u53BF",
    "230231": "\u62DC\u6CC9\u53BF",
    "230281": "\u8BB7\u6CB3\u5E02"
  },
  "230300": {
    "230301": "\u5E02\u8F96\u533A",
    "230302": "\u9E21\u51A0\u533A",
    "230303": "\u6052\u5C71\u533A",
    "230304": "\u6EF4\u9053\u533A",
    "230305": "\u68A8\u6811\u533A",
    "230306": "\u57CE\u5B50\u6CB3\u533A",
    "230307": "\u9EBB\u5C71\u533A",
    "230321": "\u9E21\u4E1C\u53BF",
    "230381": "\u864E\u6797\u5E02",
    "230382": "\u5BC6\u5C71\u5E02"
  },
  "230400": {
    "230401": "\u5E02\u8F96\u533A",
    "230402": "\u5411\u9633\u533A",
    "230403": "\u5DE5\u519C\u533A",
    "230404": "\u5357\u5C71\u533A",
    "230405": "\u5174\u5B89\u533A",
    "230406": "\u4E1C\u5C71\u533A",
    "230407": "\u5174\u5C71\u533A",
    "230421": "\u841D\u5317\u53BF",
    "230422": "\u7EE5\u6EE8\u53BF"
  },
  "230500": {
    "230501": "\u5E02\u8F96\u533A",
    "230502": "\u5C16\u5C71\u533A",
    "230503": "\u5CAD\u4E1C\u533A",
    "230505": "\u56DB\u65B9\u53F0\u533A",
    "230506": "\u5B9D\u5C71\u533A",
    "230521": "\u96C6\u8D24\u53BF",
    "230522": "\u53CB\u8C0A\u53BF",
    "230523": "\u5B9D\u6E05\u53BF",
    "230524": "\u9976\u6CB3\u53BF"
  },
  "230600": {
    "230601": "\u5E02\u8F96\u533A",
    "230602": "\u8428\u5C14\u56FE\u533A",
    "230603": "\u9F99\u51E4\u533A",
    "230604": "\u8BA9\u80E1\u8DEF\u533A",
    "230605": "\u7EA2\u5C97\u533A",
    "230606": "\u5927\u540C\u533A",
    "230621": "\u8087\u5DDE\u53BF",
    "230622": "\u8087\u6E90\u53BF",
    "230623": "\u6797\u7538\u53BF",
    "230624": "\u675C\u5C14\u4F2F\u7279\u8499\u53E4\u65CF\u81EA\u6CBB\u53BF",
    "230671": "\u5927\u5E86\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A"
  },
  "230700": {
    "230701": "\u5E02\u8F96\u533A",
    "230717": "\u4F0A\u7F8E\u533A",
    "230718": "\u4E4C\u7FE0\u533A",
    "230719": "\u53CB\u597D\u533A",
    "230722": "\u5609\u836B\u53BF",
    "230723": "\u6C64\u65FA\u53BF",
    "230724": "\u4E30\u6797\u53BF",
    "230725": "\u5927\u7B90\u5C71\u53BF",
    "230726": "\u5357\u5C94\u53BF",
    "230751": "\u91D1\u6797\u533A",
    "230781": "\u94C1\u529B\u5E02"
  },
  "230800": {
    "230801": "\u5E02\u8F96\u533A",
    "230803": "\u5411\u9633\u533A",
    "230804": "\u524D\u8FDB\u533A",
    "230805": "\u4E1C\u98CE\u533A",
    "230811": "\u90CA\u533A",
    "230822": "\u6866\u5357\u53BF",
    "230826": "\u6866\u5DDD\u53BF",
    "230828": "\u6C64\u539F\u53BF",
    "230881": "\u540C\u6C5F\u5E02",
    "230882": "\u5BCC\u9526\u5E02",
    "230883": "\u629A\u8FDC\u5E02"
  },
  "230900": {
    "230901": "\u5E02\u8F96\u533A",
    "230902": "\u65B0\u5174\u533A",
    "230903": "\u6843\u5C71\u533A",
    "230904": "\u8304\u5B50\u6CB3\u533A",
    "230921": "\u52C3\u5229\u53BF"
  },
  "231000": {
    "231001": "\u5E02\u8F96\u533A",
    "231002": "\u4E1C\u5B89\u533A",
    "231003": "\u9633\u660E\u533A",
    "231004": "\u7231\u6C11\u533A",
    "231005": "\u897F\u5B89\u533A",
    "231025": "\u6797\u53E3\u53BF",
    "231071": "\u7261\u4E39\u6C5F\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "231081": "\u7EE5\u82AC\u6CB3\u5E02",
    "231083": "\u6D77\u6797\u5E02",
    "231084": "\u5B81\u5B89\u5E02",
    "231085": "\u7A46\u68F1\u5E02",
    "231086": "\u4E1C\u5B81\u5E02"
  },
  "231100": {
    "231101": "\u5E02\u8F96\u533A",
    "231102": "\u7231\u8F89\u533A",
    "231123": "\u900A\u514B\u53BF",
    "231124": "\u5B59\u5434\u53BF",
    "231181": "\u5317\u5B89\u5E02",
    "231182": "\u4E94\u5927\u8FDE\u6C60\u5E02",
    "231183": "\u5AE9\u6C5F\u5E02"
  },
  "231200": {
    "231201": "\u5E02\u8F96\u533A",
    "231202": "\u5317\u6797\u533A",
    "231221": "\u671B\u594E\u53BF",
    "231222": "\u5170\u897F\u53BF",
    "231223": "\u9752\u5188\u53BF",
    "231224": "\u5E86\u5B89\u53BF",
    "231225": "\u660E\u6C34\u53BF",
    "231226": "\u7EE5\u68F1\u53BF",
    "231281": "\u5B89\u8FBE\u5E02",
    "231282": "\u8087\u4E1C\u5E02",
    "231283": "\u6D77\u4F26\u5E02"
  },
  "232700": {
    "232701": "\u6F20\u6CB3\u5E02",
    "232721": "\u547C\u739B\u53BF",
    "232722": "\u5854\u6CB3\u53BF",
    "232761": "\u52A0\u683C\u8FBE\u5947\u533A",
    "232762": "\u677E\u5CAD\u533A",
    "232763": "\u65B0\u6797\u533A",
    "232764": "\u547C\u4E2D\u533A"
  },
  "310000": {
    "310100": "\u5E02\u8F96\u533A"
  },
  "310100": {
    "310101": "\u9EC4\u6D66\u533A",
    "310104": "\u5F90\u6C47\u533A",
    "310105": "\u957F\u5B81\u533A",
    "310106": "\u9759\u5B89\u533A",
    "310107": "\u666E\u9640\u533A",
    "310109": "\u8679\u53E3\u533A",
    "310110": "\u6768\u6D66\u533A",
    "310112": "\u95F5\u884C\u533A",
    "310113": "\u5B9D\u5C71\u533A",
    "310114": "\u5609\u5B9A\u533A",
    "310115": "\u6D66\u4E1C\u65B0\u533A",
    "310116": "\u91D1\u5C71\u533A",
    "310117": "\u677E\u6C5F\u533A",
    "310118": "\u9752\u6D66\u533A",
    "310120": "\u5949\u8D24\u533A",
    "310151": "\u5D07\u660E\u533A"
  },
  "320000": {
    "320100": "\u5357\u4EAC\u5E02",
    "320200": "\u65E0\u9521\u5E02",
    "320300": "\u5F90\u5DDE\u5E02",
    "320400": "\u5E38\u5DDE\u5E02",
    "320500": "\u82CF\u5DDE\u5E02",
    "320600": "\u5357\u901A\u5E02",
    "320700": "\u8FDE\u4E91\u6E2F\u5E02",
    "320800": "\u6DEE\u5B89\u5E02",
    "320900": "\u76D0\u57CE\u5E02",
    "321000": "\u626C\u5DDE\u5E02",
    "321100": "\u9547\u6C5F\u5E02",
    "321200": "\u6CF0\u5DDE\u5E02",
    "321300": "\u5BBF\u8FC1\u5E02"
  },
  "320100": {
    "320101": "\u5E02\u8F96\u533A",
    "320102": "\u7384\u6B66\u533A",
    "320104": "\u79E6\u6DEE\u533A",
    "320105": "\u5EFA\u90BA\u533A",
    "320106": "\u9F13\u697C\u533A",
    "320111": "\u6D66\u53E3\u533A",
    "320113": "\u6816\u971E\u533A",
    "320114": "\u96E8\u82B1\u53F0\u533A",
    "320115": "\u6C5F\u5B81\u533A",
    "320116": "\u516D\u5408\u533A",
    "320117": "\u6EA7\u6C34\u533A",
    "320118": "\u9AD8\u6DF3\u533A"
  },
  "320200": {
    "320201": "\u5E02\u8F96\u533A",
    "320205": "\u9521\u5C71\u533A",
    "320206": "\u60E0\u5C71\u533A",
    "320211": "\u6EE8\u6E56\u533A",
    "320213": "\u6881\u6EAA\u533A",
    "320214": "\u65B0\u5434\u533A",
    "320281": "\u6C5F\u9634\u5E02",
    "320282": "\u5B9C\u5174\u5E02"
  },
  "320300": {
    "320301": "\u5E02\u8F96\u533A",
    "320302": "\u9F13\u697C\u533A",
    "320303": "\u4E91\u9F99\u533A",
    "320305": "\u8D3E\u6C6A\u533A",
    "320311": "\u6CC9\u5C71\u533A",
    "320312": "\u94DC\u5C71\u533A",
    "320321": "\u4E30\u53BF",
    "320322": "\u6C9B\u53BF",
    "320324": "\u7762\u5B81\u53BF",
    "320371": "\u5F90\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "320381": "\u65B0\u6C82\u5E02",
    "320382": "\u90B3\u5DDE\u5E02"
  },
  "320400": {
    "320401": "\u5E02\u8F96\u533A",
    "320402": "\u5929\u5B81\u533A",
    "320404": "\u949F\u697C\u533A",
    "320411": "\u65B0\u5317\u533A",
    "320412": "\u6B66\u8FDB\u533A",
    "320413": "\u91D1\u575B\u533A",
    "320481": "\u6EA7\u9633\u5E02"
  },
  "320500": {
    "320501": "\u5E02\u8F96\u533A",
    "320505": "\u864E\u4E18\u533A",
    "320506": "\u5434\u4E2D\u533A",
    "320507": "\u76F8\u57CE\u533A",
    "320508": "\u59D1\u82CF\u533A",
    "320509": "\u5434\u6C5F\u533A",
    "320571": "\u82CF\u5DDE\u5DE5\u4E1A\u56ED\u533A",
    "320581": "\u5E38\u719F\u5E02",
    "320582": "\u5F20\u5BB6\u6E2F\u5E02",
    "320583": "\u6606\u5C71\u5E02",
    "320585": "\u592A\u4ED3\u5E02"
  },
  "320600": {
    "320601": "\u5E02\u8F96\u533A",
    "320602": "\u5D07\u5DDD\u533A",
    "320611": "\u6E2F\u95F8\u533A",
    "320612": "\u901A\u5DDE\u533A",
    "320623": "\u5982\u4E1C\u53BF",
    "320671": "\u5357\u901A\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "320681": "\u542F\u4E1C\u5E02",
    "320682": "\u5982\u768B\u5E02",
    "320684": "\u6D77\u95E8\u5E02",
    "320685": "\u6D77\u5B89\u5E02"
  },
  "320700": {
    "320701": "\u5E02\u8F96\u533A",
    "320703": "\u8FDE\u4E91\u533A",
    "320706": "\u6D77\u5DDE\u533A",
    "320707": "\u8D63\u6986\u533A",
    "320722": "\u4E1C\u6D77\u53BF",
    "320723": "\u704C\u4E91\u53BF",
    "320724": "\u704C\u5357\u53BF",
    "320771": "\u8FDE\u4E91\u6E2F\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "320772": "\u8FDE\u4E91\u6E2F\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A"
  },
  "320800": {
    "320801": "\u5E02\u8F96\u533A",
    "320803": "\u6DEE\u5B89\u533A",
    "320804": "\u6DEE\u9634\u533A",
    "320812": "\u6E05\u6C5F\u6D66\u533A",
    "320813": "\u6D2A\u6CFD\u533A",
    "320826": "\u6D9F\u6C34\u53BF",
    "320830": "\u76F1\u7719\u53BF",
    "320831": "\u91D1\u6E56\u53BF",
    "320871": "\u6DEE\u5B89\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "320900": {
    "320901": "\u5E02\u8F96\u533A",
    "320902": "\u4EAD\u6E56\u533A",
    "320903": "\u76D0\u90FD\u533A",
    "320904": "\u5927\u4E30\u533A",
    "320921": "\u54CD\u6C34\u53BF",
    "320922": "\u6EE8\u6D77\u53BF",
    "320923": "\u961C\u5B81\u53BF",
    "320924": "\u5C04\u9633\u53BF",
    "320925": "\u5EFA\u6E56\u53BF",
    "320971": "\u76D0\u57CE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "320981": "\u4E1C\u53F0\u5E02"
  },
  "321000": {
    "321001": "\u5E02\u8F96\u533A",
    "321002": "\u5E7F\u9675\u533A",
    "321003": "\u9097\u6C5F\u533A",
    "321012": "\u6C5F\u90FD\u533A",
    "321023": "\u5B9D\u5E94\u53BF",
    "321071": "\u626C\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "321081": "\u4EEA\u5F81\u5E02",
    "321084": "\u9AD8\u90AE\u5E02"
  },
  "321100": {
    "321101": "\u5E02\u8F96\u533A",
    "321102": "\u4EAC\u53E3\u533A",
    "321111": "\u6DA6\u5DDE\u533A",
    "321112": "\u4E39\u5F92\u533A",
    "321171": "\u9547\u6C5F\u65B0\u533A",
    "321181": "\u4E39\u9633\u5E02",
    "321182": "\u626C\u4E2D\u5E02",
    "321183": "\u53E5\u5BB9\u5E02"
  },
  "321200": {
    "321201": "\u5E02\u8F96\u533A",
    "321202": "\u6D77\u9675\u533A",
    "321203": "\u9AD8\u6E2F\u533A",
    "321204": "\u59DC\u5830\u533A",
    "321271": "\u6CF0\u5DDE\u533B\u836F\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "321281": "\u5174\u5316\u5E02",
    "321282": "\u9756\u6C5F\u5E02",
    "321283": "\u6CF0\u5174\u5E02"
  },
  "321300": {
    "321301": "\u5E02\u8F96\u533A",
    "321302": "\u5BBF\u57CE\u533A",
    "321311": "\u5BBF\u8C6B\u533A",
    "321322": "\u6CAD\u9633\u53BF",
    "321323": "\u6CD7\u9633\u53BF",
    "321324": "\u6CD7\u6D2A\u53BF",
    "321371": "\u5BBF\u8FC1\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "330000": {
    "330100": "\u676D\u5DDE\u5E02",
    "330200": "\u5B81\u6CE2\u5E02",
    "330300": "\u6E29\u5DDE\u5E02",
    "330400": "\u5609\u5174\u5E02",
    "330500": "\u6E56\u5DDE\u5E02",
    "330600": "\u7ECD\u5174\u5E02",
    "330700": "\u91D1\u534E\u5E02",
    "330800": "\u8862\u5DDE\u5E02",
    "330900": "\u821F\u5C71\u5E02",
    "331000": "\u53F0\u5DDE\u5E02",
    "331100": "\u4E3D\u6C34\u5E02"
  },
  "330100": {
    "330101": "\u5E02\u8F96\u533A",
    "330102": "\u4E0A\u57CE\u533A",
    "330103": "\u4E0B\u57CE\u533A",
    "330104": "\u6C5F\u5E72\u533A",
    "330105": "\u62F1\u5885\u533A",
    "330106": "\u897F\u6E56\u533A",
    "330108": "\u6EE8\u6C5F\u533A",
    "330109": "\u8427\u5C71\u533A",
    "330110": "\u4F59\u676D\u533A",
    "330111": "\u5BCC\u9633\u533A",
    "330112": "\u4E34\u5B89\u533A",
    "330122": "\u6850\u5E90\u53BF",
    "330127": "\u6DF3\u5B89\u53BF",
    "330182": "\u5EFA\u5FB7\u5E02"
  },
  "330200": {
    "330201": "\u5E02\u8F96\u533A",
    "330203": "\u6D77\u66D9\u533A",
    "330205": "\u6C5F\u5317\u533A",
    "330206": "\u5317\u4ED1\u533A",
    "330211": "\u9547\u6D77\u533A",
    "330212": "\u911E\u5DDE\u533A",
    "330213": "\u5949\u5316\u533A",
    "330225": "\u8C61\u5C71\u53BF",
    "330226": "\u5B81\u6D77\u53BF",
    "330281": "\u4F59\u59DA\u5E02",
    "330282": "\u6148\u6EAA\u5E02"
  },
  "330300": {
    "330301": "\u5E02\u8F96\u533A",
    "330302": "\u9E7F\u57CE\u533A",
    "330303": "\u9F99\u6E7E\u533A",
    "330304": "\u74EF\u6D77\u533A",
    "330305": "\u6D1E\u5934\u533A",
    "330324": "\u6C38\u5609\u53BF",
    "330326": "\u5E73\u9633\u53BF",
    "330327": "\u82CD\u5357\u53BF",
    "330328": "\u6587\u6210\u53BF",
    "330329": "\u6CF0\u987A\u53BF",
    "330371": "\u6E29\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "330381": "\u745E\u5B89\u5E02",
    "330382": "\u4E50\u6E05\u5E02",
    "330383": "\u9F99\u6E2F\u5E02"
  },
  "330400": {
    "330401": "\u5E02\u8F96\u533A",
    "330402": "\u5357\u6E56\u533A",
    "330411": "\u79C0\u6D32\u533A",
    "330421": "\u5609\u5584\u53BF",
    "330424": "\u6D77\u76D0\u53BF",
    "330481": "\u6D77\u5B81\u5E02",
    "330482": "\u5E73\u6E56\u5E02",
    "330483": "\u6850\u4E61\u5E02"
  },
  "330500": {
    "330501": "\u5E02\u8F96\u533A",
    "330502": "\u5434\u5174\u533A",
    "330503": "\u5357\u6D54\u533A",
    "330521": "\u5FB7\u6E05\u53BF",
    "330522": "\u957F\u5174\u53BF",
    "330523": "\u5B89\u5409\u53BF"
  },
  "330600": {
    "330601": "\u5E02\u8F96\u533A",
    "330602": "\u8D8A\u57CE\u533A",
    "330603": "\u67EF\u6865\u533A",
    "330604": "\u4E0A\u865E\u533A",
    "330624": "\u65B0\u660C\u53BF",
    "330681": "\u8BF8\u66A8\u5E02",
    "330683": "\u5D4A\u5DDE\u5E02"
  },
  "330700": {
    "330701": "\u5E02\u8F96\u533A",
    "330702": "\u5A7A\u57CE\u533A",
    "330703": "\u91D1\u4E1C\u533A",
    "330723": "\u6B66\u4E49\u53BF",
    "330726": "\u6D66\u6C5F\u53BF",
    "330727": "\u78D0\u5B89\u53BF",
    "330781": "\u5170\u6EAA\u5E02",
    "330782": "\u4E49\u4E4C\u5E02",
    "330783": "\u4E1C\u9633\u5E02",
    "330784": "\u6C38\u5EB7\u5E02"
  },
  "330800": {
    "330801": "\u5E02\u8F96\u533A",
    "330802": "\u67EF\u57CE\u533A",
    "330803": "\u8862\u6C5F\u533A",
    "330822": "\u5E38\u5C71\u53BF",
    "330824": "\u5F00\u5316\u53BF",
    "330825": "\u9F99\u6E38\u53BF",
    "330881": "\u6C5F\u5C71\u5E02"
  },
  "330900": {
    "330901": "\u5E02\u8F96\u533A",
    "330902": "\u5B9A\u6D77\u533A",
    "330903": "\u666E\u9640\u533A",
    "330921": "\u5CB1\u5C71\u53BF",
    "330922": "\u5D4A\u6CD7\u53BF"
  },
  "331000": {
    "331001": "\u5E02\u8F96\u533A",
    "331002": "\u6912\u6C5F\u533A",
    "331003": "\u9EC4\u5CA9\u533A",
    "331004": "\u8DEF\u6865\u533A",
    "331022": "\u4E09\u95E8\u53BF",
    "331023": "\u5929\u53F0\u53BF",
    "331024": "\u4ED9\u5C45\u53BF",
    "331081": "\u6E29\u5CAD\u5E02",
    "331082": "\u4E34\u6D77\u5E02",
    "331083": "\u7389\u73AF\u5E02"
  },
  "331100": {
    "331101": "\u5E02\u8F96\u533A",
    "331102": "\u83B2\u90FD\u533A",
    "331121": "\u9752\u7530\u53BF",
    "331122": "\u7F19\u4E91\u53BF",
    "331123": "\u9042\u660C\u53BF",
    "331124": "\u677E\u9633\u53BF",
    "331125": "\u4E91\u548C\u53BF",
    "331126": "\u5E86\u5143\u53BF",
    "331127": "\u666F\u5B81\u7572\u65CF\u81EA\u6CBB\u53BF",
    "331181": "\u9F99\u6CC9\u5E02"
  },
  "340000": {
    "340100": "\u5408\u80A5\u5E02",
    "340200": "\u829C\u6E56\u5E02",
    "340300": "\u868C\u57E0\u5E02",
    "340400": "\u6DEE\u5357\u5E02",
    "340500": "\u9A6C\u978D\u5C71\u5E02",
    "340600": "\u6DEE\u5317\u5E02",
    "340700": "\u94DC\u9675\u5E02",
    "340800": "\u5B89\u5E86\u5E02",
    "341000": "\u9EC4\u5C71\u5E02",
    "341100": "\u6EC1\u5DDE\u5E02",
    "341200": "\u961C\u9633\u5E02",
    "341300": "\u5BBF\u5DDE\u5E02",
    "341500": "\u516D\u5B89\u5E02",
    "341600": "\u4EB3\u5DDE\u5E02",
    "341700": "\u6C60\u5DDE\u5E02",
    "341800": "\u5BA3\u57CE\u5E02"
  },
  "340100": {
    "340101": "\u5E02\u8F96\u533A",
    "340102": "\u7476\u6D77\u533A",
    "340103": "\u5E90\u9633\u533A",
    "340104": "\u8700\u5C71\u533A",
    "340111": "\u5305\u6CB3\u533A",
    "340121": "\u957F\u4E30\u53BF",
    "340122": "\u80A5\u4E1C\u53BF",
    "340123": "\u80A5\u897F\u53BF",
    "340124": "\u5E90\u6C5F\u53BF",
    "340171": "\u5408\u80A5\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "340172": "\u5408\u80A5\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "340173": "\u5408\u80A5\u65B0\u7AD9\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "340181": "\u5DE2\u6E56\u5E02"
  },
  "340200": {
    "340201": "\u5E02\u8F96\u533A",
    "340202": "\u955C\u6E56\u533A",
    "340203": "\u5F0B\u6C5F\u533A",
    "340207": "\u9E20\u6C5F\u533A",
    "340208": "\u4E09\u5C71\u533A",
    "340221": "\u829C\u6E56\u53BF",
    "340222": "\u7E41\u660C\u53BF",
    "340223": "\u5357\u9675\u53BF",
    "340225": "\u65E0\u4E3A\u53BF",
    "340271": "\u829C\u6E56\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "340272": "\u5B89\u5FBD\u829C\u6E56\u957F\u6C5F\u5927\u6865\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "340300": {
    "340301": "\u5E02\u8F96\u533A",
    "340302": "\u9F99\u5B50\u6E56\u533A",
    "340303": "\u868C\u5C71\u533A",
    "340304": "\u79B9\u4F1A\u533A",
    "340311": "\u6DEE\u4E0A\u533A",
    "340321": "\u6000\u8FDC\u53BF",
    "340322": "\u4E94\u6CB3\u53BF",
    "340323": "\u56FA\u9547\u53BF",
    "340371": "\u868C\u57E0\u5E02\u9AD8\u65B0\u6280\u672F\u5F00\u53D1\u533A",
    "340372": "\u868C\u57E0\u5E02\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "340400": {
    "340401": "\u5E02\u8F96\u533A",
    "340402": "\u5927\u901A\u533A",
    "340403": "\u7530\u5BB6\u5EB5\u533A",
    "340404": "\u8C22\u5BB6\u96C6\u533A",
    "340405": "\u516B\u516C\u5C71\u533A",
    "340406": "\u6F58\u96C6\u533A",
    "340421": "\u51E4\u53F0\u53BF",
    "340422": "\u5BFF\u53BF"
  },
  "340500": {
    "340501": "\u5E02\u8F96\u533A",
    "340503": "\u82B1\u5C71\u533A",
    "340504": "\u96E8\u5C71\u533A",
    "340506": "\u535A\u671B\u533A",
    "340521": "\u5F53\u6D82\u53BF",
    "340522": "\u542B\u5C71\u53BF",
    "340523": "\u548C\u53BF"
  },
  "340600": {
    "340601": "\u5E02\u8F96\u533A",
    "340602": "\u675C\u96C6\u533A",
    "340603": "\u76F8\u5C71\u533A",
    "340604": "\u70C8\u5C71\u533A",
    "340621": "\u6FC9\u6EAA\u53BF"
  },
  "340700": {
    "340701": "\u5E02\u8F96\u533A",
    "340705": "\u94DC\u5B98\u533A",
    "340706": "\u4E49\u5B89\u533A",
    "340711": "\u90CA\u533A",
    "340722": "\u679E\u9633\u53BF"
  },
  "340800": {
    "340801": "\u5E02\u8F96\u533A",
    "340802": "\u8FCE\u6C5F\u533A",
    "340803": "\u5927\u89C2\u533A",
    "340811": "\u5B9C\u79C0\u533A",
    "340822": "\u6000\u5B81\u53BF",
    "340825": "\u592A\u6E56\u53BF",
    "340826": "\u5BBF\u677E\u53BF",
    "340827": "\u671B\u6C5F\u53BF",
    "340828": "\u5CB3\u897F\u53BF",
    "340871": "\u5B89\u5FBD\u5B89\u5E86\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "340881": "\u6850\u57CE\u5E02",
    "340882": "\u6F5C\u5C71\u5E02"
  },
  "341000": {
    "341001": "\u5E02\u8F96\u533A",
    "341002": "\u5C6F\u6EAA\u533A",
    "341003": "\u9EC4\u5C71\u533A",
    "341004": "\u5FBD\u5DDE\u533A",
    "341021": "\u6B59\u53BF",
    "341022": "\u4F11\u5B81\u53BF",
    "341023": "\u9EDF\u53BF",
    "341024": "\u7941\u95E8\u53BF"
  },
  "341100": {
    "341101": "\u5E02\u8F96\u533A",
    "341102": "\u7405\u740A\u533A",
    "341103": "\u5357\u8C2F\u533A",
    "341122": "\u6765\u5B89\u53BF",
    "341124": "\u5168\u6912\u53BF",
    "341125": "\u5B9A\u8FDC\u53BF",
    "341126": "\u51E4\u9633\u53BF",
    "341171": "\u82CF\u6EC1\u73B0\u4EE3\u4EA7\u4E1A\u56ED",
    "341172": "\u6EC1\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "341181": "\u5929\u957F\u5E02",
    "341182": "\u660E\u5149\u5E02"
  },
  "341200": {
    "341201": "\u5E02\u8F96\u533A",
    "341202": "\u988D\u5DDE\u533A",
    "341203": "\u988D\u4E1C\u533A",
    "341204": "\u988D\u6CC9\u533A",
    "341221": "\u4E34\u6CC9\u53BF",
    "341222": "\u592A\u548C\u53BF",
    "341225": "\u961C\u5357\u53BF",
    "341226": "\u988D\u4E0A\u53BF",
    "341271": "\u961C\u9633\u5408\u80A5\u73B0\u4EE3\u4EA7\u4E1A\u56ED\u533A",
    "341272": "\u961C\u9633\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "341282": "\u754C\u9996\u5E02"
  },
  "341300": {
    "341301": "\u5E02\u8F96\u533A",
    "341302": "\u57C7\u6865\u533A",
    "341321": "\u7800\u5C71\u53BF",
    "341322": "\u8427\u53BF",
    "341323": "\u7075\u74A7\u53BF",
    "341324": "\u6CD7\u53BF",
    "341371": "\u5BBF\u5DDE\u9A6C\u978D\u5C71\u73B0\u4EE3\u4EA7\u4E1A\u56ED\u533A",
    "341372": "\u5BBF\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "341500": {
    "341501": "\u5E02\u8F96\u533A",
    "341502": "\u91D1\u5B89\u533A",
    "341503": "\u88D5\u5B89\u533A",
    "341504": "\u53F6\u96C6\u533A",
    "341522": "\u970D\u90B1\u53BF",
    "341523": "\u8212\u57CE\u53BF",
    "341524": "\u91D1\u5BE8\u53BF",
    "341525": "\u970D\u5C71\u53BF"
  },
  "341600": {
    "341601": "\u5E02\u8F96\u533A",
    "341602": "\u8C2F\u57CE\u533A",
    "341621": "\u6DA1\u9633\u53BF",
    "341622": "\u8499\u57CE\u53BF",
    "341623": "\u5229\u8F9B\u53BF"
  },
  "341700": {
    "341701": "\u5E02\u8F96\u533A",
    "341702": "\u8D35\u6C60\u533A",
    "341721": "\u4E1C\u81F3\u53BF",
    "341722": "\u77F3\u53F0\u53BF",
    "341723": "\u9752\u9633\u53BF"
  },
  "341800": {
    "341801": "\u5E02\u8F96\u533A",
    "341802": "\u5BA3\u5DDE\u533A",
    "341821": "\u90CE\u6EAA\u53BF",
    "341823": "\u6CFE\u53BF",
    "341824": "\u7EE9\u6EAA\u53BF",
    "341825": "\u65CC\u5FB7\u53BF",
    "341871": "\u5BA3\u57CE\u5E02\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "341881": "\u5B81\u56FD\u5E02",
    "341882": "\u5E7F\u5FB7\u5E02"
  },
  "350000": {
    "350100": "\u798F\u5DDE\u5E02",
    "350200": "\u53A6\u95E8\u5E02",
    "350300": "\u8386\u7530\u5E02",
    "350400": "\u4E09\u660E\u5E02",
    "350500": "\u6CC9\u5DDE\u5E02",
    "350600": "\u6F33\u5DDE\u5E02",
    "350700": "\u5357\u5E73\u5E02",
    "350800": "\u9F99\u5CA9\u5E02",
    "350900": "\u5B81\u5FB7\u5E02"
  },
  "350100": {
    "350101": "\u5E02\u8F96\u533A",
    "350102": "\u9F13\u697C\u533A",
    "350103": "\u53F0\u6C5F\u533A",
    "350104": "\u4ED3\u5C71\u533A",
    "350105": "\u9A6C\u5C3E\u533A",
    "350111": "\u664B\u5B89\u533A",
    "350112": "\u957F\u4E50\u533A",
    "350121": "\u95FD\u4FAF\u53BF",
    "350122": "\u8FDE\u6C5F\u53BF",
    "350123": "\u7F57\u6E90\u53BF",
    "350124": "\u95FD\u6E05\u53BF",
    "350125": "\u6C38\u6CF0\u53BF",
    "350128": "\u5E73\u6F6D\u53BF",
    "350181": "\u798F\u6E05\u5E02"
  },
  "350200": {
    "350201": "\u5E02\u8F96\u533A",
    "350203": "\u601D\u660E\u533A",
    "350205": "\u6D77\u6CA7\u533A",
    "350206": "\u6E56\u91CC\u533A",
    "350211": "\u96C6\u7F8E\u533A",
    "350212": "\u540C\u5B89\u533A",
    "350213": "\u7FD4\u5B89\u533A"
  },
  "350300": {
    "350301": "\u5E02\u8F96\u533A",
    "350302": "\u57CE\u53A2\u533A",
    "350303": "\u6DB5\u6C5F\u533A",
    "350304": "\u8354\u57CE\u533A",
    "350305": "\u79C0\u5C7F\u533A",
    "350322": "\u4ED9\u6E38\u53BF"
  },
  "350400": {
    "350401": "\u5E02\u8F96\u533A",
    "350402": "\u6885\u5217\u533A",
    "350403": "\u4E09\u5143\u533A",
    "350421": "\u660E\u6EAA\u53BF",
    "350423": "\u6E05\u6D41\u53BF",
    "350424": "\u5B81\u5316\u53BF",
    "350425": "\u5927\u7530\u53BF",
    "350426": "\u5C24\u6EAA\u53BF",
    "350427": "\u6C99\u53BF",
    "350428": "\u5C06\u4E50\u53BF",
    "350429": "\u6CF0\u5B81\u53BF",
    "350430": "\u5EFA\u5B81\u53BF",
    "350481": "\u6C38\u5B89\u5E02"
  },
  "350500": {
    "350501": "\u5E02\u8F96\u533A",
    "350502": "\u9CA4\u57CE\u533A",
    "350503": "\u4E30\u6CFD\u533A",
    "350504": "\u6D1B\u6C5F\u533A",
    "350505": "\u6CC9\u6E2F\u533A",
    "350521": "\u60E0\u5B89\u53BF",
    "350524": "\u5B89\u6EAA\u53BF",
    "350525": "\u6C38\u6625\u53BF",
    "350526": "\u5FB7\u5316\u53BF",
    "350527": "\u91D1\u95E8\u53BF",
    "350581": "\u77F3\u72EE\u5E02",
    "350582": "\u664B\u6C5F\u5E02",
    "350583": "\u5357\u5B89\u5E02"
  },
  "350600": {
    "350601": "\u5E02\u8F96\u533A",
    "350602": "\u8297\u57CE\u533A",
    "350603": "\u9F99\u6587\u533A",
    "350622": "\u4E91\u9704\u53BF",
    "350623": "\u6F33\u6D66\u53BF",
    "350624": "\u8BCF\u5B89\u53BF",
    "350625": "\u957F\u6CF0\u53BF",
    "350626": "\u4E1C\u5C71\u53BF",
    "350627": "\u5357\u9756\u53BF",
    "350628": "\u5E73\u548C\u53BF",
    "350629": "\u534E\u5B89\u53BF",
    "350681": "\u9F99\u6D77\u5E02"
  },
  "350700": {
    "350701": "\u5E02\u8F96\u533A",
    "350702": "\u5EF6\u5E73\u533A",
    "350703": "\u5EFA\u9633\u533A",
    "350721": "\u987A\u660C\u53BF",
    "350722": "\u6D66\u57CE\u53BF",
    "350723": "\u5149\u6CFD\u53BF",
    "350724": "\u677E\u6EAA\u53BF",
    "350725": "\u653F\u548C\u53BF",
    "350781": "\u90B5\u6B66\u5E02",
    "350782": "\u6B66\u5937\u5C71\u5E02",
    "350783": "\u5EFA\u74EF\u5E02"
  },
  "350800": {
    "350801": "\u5E02\u8F96\u533A",
    "350802": "\u65B0\u7F57\u533A",
    "350803": "\u6C38\u5B9A\u533A",
    "350821": "\u957F\u6C40\u53BF",
    "350823": "\u4E0A\u676D\u53BF",
    "350824": "\u6B66\u5E73\u53BF",
    "350825": "\u8FDE\u57CE\u53BF",
    "350881": "\u6F33\u5E73\u5E02"
  },
  "350900": {
    "350901": "\u5E02\u8F96\u533A",
    "350902": "\u8549\u57CE\u533A",
    "350921": "\u971E\u6D66\u53BF",
    "350922": "\u53E4\u7530\u53BF",
    "350923": "\u5C4F\u5357\u53BF",
    "350924": "\u5BFF\u5B81\u53BF",
    "350925": "\u5468\u5B81\u53BF",
    "350926": "\u67D8\u8363\u53BF",
    "350981": "\u798F\u5B89\u5E02",
    "350982": "\u798F\u9F0E\u5E02"
  },
  "360000": {
    "360100": "\u5357\u660C\u5E02",
    "360200": "\u666F\u5FB7\u9547\u5E02",
    "360300": "\u840D\u4E61\u5E02",
    "360400": "\u4E5D\u6C5F\u5E02",
    "360500": "\u65B0\u4F59\u5E02",
    "360600": "\u9E70\u6F6D\u5E02",
    "360700": "\u8D63\u5DDE\u5E02",
    "360800": "\u5409\u5B89\u5E02",
    "360900": "\u5B9C\u6625\u5E02",
    "361000": "\u629A\u5DDE\u5E02",
    "361100": "\u4E0A\u9976\u5E02"
  },
  "360100": {
    "360101": "\u5E02\u8F96\u533A",
    "360102": "\u4E1C\u6E56\u533A",
    "360103": "\u897F\u6E56\u533A",
    "360104": "\u9752\u4E91\u8C31\u533A",
    "360105": "\u6E7E\u91CC\u533A",
    "360111": "\u9752\u5C71\u6E56\u533A",
    "360112": "\u65B0\u5EFA\u533A",
    "360121": "\u5357\u660C\u53BF",
    "360123": "\u5B89\u4E49\u53BF",
    "360124": "\u8FDB\u8D24\u53BF"
  },
  "360200": {
    "360201": "\u5E02\u8F96\u533A",
    "360202": "\u660C\u6C5F\u533A",
    "360203": "\u73E0\u5C71\u533A",
    "360222": "\u6D6E\u6881\u53BF",
    "360281": "\u4E50\u5E73\u5E02"
  },
  "360300": {
    "360301": "\u5E02\u8F96\u533A",
    "360302": "\u5B89\u6E90\u533A",
    "360313": "\u6E58\u4E1C\u533A",
    "360321": "\u83B2\u82B1\u53BF",
    "360322": "\u4E0A\u6817\u53BF",
    "360323": "\u82A6\u6EAA\u53BF"
  },
  "360400": {
    "360401": "\u5E02\u8F96\u533A",
    "360402": "\u6FC2\u6EAA\u533A",
    "360403": "\u6D54\u9633\u533A",
    "360404": "\u67F4\u6851\u533A",
    "360423": "\u6B66\u5B81\u53BF",
    "360424": "\u4FEE\u6C34\u53BF",
    "360425": "\u6C38\u4FEE\u53BF",
    "360426": "\u5FB7\u5B89\u53BF",
    "360428": "\u90FD\u660C\u53BF",
    "360429": "\u6E56\u53E3\u53BF",
    "360430": "\u5F6D\u6CFD\u53BF",
    "360481": "\u745E\u660C\u5E02",
    "360482": "\u5171\u9752\u57CE\u5E02",
    "360483": "\u5E90\u5C71\u5E02"
  },
  "360500": {
    "360501": "\u5E02\u8F96\u533A",
    "360502": "\u6E1D\u6C34\u533A",
    "360521": "\u5206\u5B9C\u53BF"
  },
  "360600": {
    "360601": "\u5E02\u8F96\u533A",
    "360602": "\u6708\u6E56\u533A",
    "360603": "\u4F59\u6C5F\u533A",
    "360681": "\u8D35\u6EAA\u5E02"
  },
  "360700": {
    "360701": "\u5E02\u8F96\u533A",
    "360702": "\u7AE0\u8D21\u533A",
    "360703": "\u5357\u5EB7\u533A",
    "360704": "\u8D63\u53BF\u533A",
    "360722": "\u4FE1\u4E30\u53BF",
    "360723": "\u5927\u4F59\u53BF",
    "360724": "\u4E0A\u72B9\u53BF",
    "360725": "\u5D07\u4E49\u53BF",
    "360726": "\u5B89\u8FDC\u53BF",
    "360727": "\u9F99\u5357\u53BF",
    "360728": "\u5B9A\u5357\u53BF",
    "360729": "\u5168\u5357\u53BF",
    "360730": "\u5B81\u90FD\u53BF",
    "360731": "\u4E8E\u90FD\u53BF",
    "360732": "\u5174\u56FD\u53BF",
    "360733": "\u4F1A\u660C\u53BF",
    "360734": "\u5BFB\u4E4C\u53BF",
    "360735": "\u77F3\u57CE\u53BF",
    "360781": "\u745E\u91D1\u5E02"
  },
  "360800": {
    "360801": "\u5E02\u8F96\u533A",
    "360802": "\u5409\u5DDE\u533A",
    "360803": "\u9752\u539F\u533A",
    "360821": "\u5409\u5B89\u53BF",
    "360822": "\u5409\u6C34\u53BF",
    "360823": "\u5CE1\u6C5F\u53BF",
    "360824": "\u65B0\u5E72\u53BF",
    "360825": "\u6C38\u4E30\u53BF",
    "360826": "\u6CF0\u548C\u53BF",
    "360827": "\u9042\u5DDD\u53BF",
    "360828": "\u4E07\u5B89\u53BF",
    "360829": "\u5B89\u798F\u53BF",
    "360830": "\u6C38\u65B0\u53BF",
    "360881": "\u4E95\u5188\u5C71\u5E02"
  },
  "360900": {
    "360901": "\u5E02\u8F96\u533A",
    "360902": "\u8881\u5DDE\u533A",
    "360921": "\u5949\u65B0\u53BF",
    "360922": "\u4E07\u8F7D\u53BF",
    "360923": "\u4E0A\u9AD8\u53BF",
    "360924": "\u5B9C\u4E30\u53BF",
    "360925": "\u9756\u5B89\u53BF",
    "360926": "\u94DC\u9F13\u53BF",
    "360981": "\u4E30\u57CE\u5E02",
    "360982": "\u6A1F\u6811\u5E02",
    "360983": "\u9AD8\u5B89\u5E02"
  },
  "361000": {
    "361001": "\u5E02\u8F96\u533A",
    "361002": "\u4E34\u5DDD\u533A",
    "361003": "\u4E1C\u4E61\u533A",
    "361021": "\u5357\u57CE\u53BF",
    "361022": "\u9ECE\u5DDD\u53BF",
    "361023": "\u5357\u4E30\u53BF",
    "361024": "\u5D07\u4EC1\u53BF",
    "361025": "\u4E50\u5B89\u53BF",
    "361026": "\u5B9C\u9EC4\u53BF",
    "361027": "\u91D1\u6EAA\u53BF",
    "361028": "\u8D44\u6EAA\u53BF",
    "361030": "\u5E7F\u660C\u53BF"
  },
  "361100": {
    "361101": "\u5E02\u8F96\u533A",
    "361102": "\u4FE1\u5DDE\u533A",
    "361103": "\u5E7F\u4E30\u533A",
    "361104": "\u5E7F\u4FE1\u533A",
    "361123": "\u7389\u5C71\u53BF",
    "361124": "\u94C5\u5C71\u53BF",
    "361125": "\u6A2A\u5CF0\u53BF",
    "361126": "\u5F0B\u9633\u53BF",
    "361127": "\u4F59\u5E72\u53BF",
    "361128": "\u9131\u9633\u53BF",
    "361129": "\u4E07\u5E74\u53BF",
    "361130": "\u5A7A\u6E90\u53BF",
    "361181": "\u5FB7\u5174\u5E02"
  },
  "370000": {
    "370100": "\u6D4E\u5357\u5E02",
    "370200": "\u9752\u5C9B\u5E02",
    "370300": "\u6DC4\u535A\u5E02",
    "370400": "\u67A3\u5E84\u5E02",
    "370500": "\u4E1C\u8425\u5E02",
    "370600": "\u70DF\u53F0\u5E02",
    "370700": "\u6F4D\u574A\u5E02",
    "370800": "\u6D4E\u5B81\u5E02",
    "370900": "\u6CF0\u5B89\u5E02",
    "371000": "\u5A01\u6D77\u5E02",
    "371100": "\u65E5\u7167\u5E02",
    "371300": "\u4E34\u6C82\u5E02",
    "371400": "\u5FB7\u5DDE\u5E02",
    "371500": "\u804A\u57CE\u5E02",
    "371600": "\u6EE8\u5DDE\u5E02",
    "371700": "\u83CF\u6CFD\u5E02"
  },
  "370100": {
    "370101": "\u5E02\u8F96\u533A",
    "370102": "\u5386\u4E0B\u533A",
    "370103": "\u5E02\u4E2D\u533A",
    "370104": "\u69D0\u836B\u533A",
    "370105": "\u5929\u6865\u533A",
    "370112": "\u5386\u57CE\u533A",
    "370113": "\u957F\u6E05\u533A",
    "370114": "\u7AE0\u4E18\u533A",
    "370115": "\u6D4E\u9633\u533A",
    "370116": "\u83B1\u829C\u533A",
    "370117": "\u94A2\u57CE\u533A",
    "370124": "\u5E73\u9634\u53BF",
    "370126": "\u5546\u6CB3\u53BF",
    "370171": "\u6D4E\u5357\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A"
  },
  "370200": {
    "370201": "\u5E02\u8F96\u533A",
    "370202": "\u5E02\u5357\u533A",
    "370203": "\u5E02\u5317\u533A",
    "370211": "\u9EC4\u5C9B\u533A",
    "370212": "\u5D02\u5C71\u533A",
    "370213": "\u674E\u6CA7\u533A",
    "370214": "\u57CE\u9633\u533A",
    "370215": "\u5373\u58A8\u533A",
    "370271": "\u9752\u5C9B\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "370281": "\u80F6\u5DDE\u5E02",
    "370283": "\u5E73\u5EA6\u5E02",
    "370285": "\u83B1\u897F\u5E02"
  },
  "370300": {
    "370301": "\u5E02\u8F96\u533A",
    "370302": "\u6DC4\u5DDD\u533A",
    "370303": "\u5F20\u5E97\u533A",
    "370304": "\u535A\u5C71\u533A",
    "370305": "\u4E34\u6DC4\u533A",
    "370306": "\u5468\u6751\u533A",
    "370321": "\u6853\u53F0\u53BF",
    "370322": "\u9AD8\u9752\u53BF",
    "370323": "\u6C82\u6E90\u53BF"
  },
  "370400": {
    "370401": "\u5E02\u8F96\u533A",
    "370402": "\u5E02\u4E2D\u533A",
    "370403": "\u859B\u57CE\u533A",
    "370404": "\u5CC4\u57CE\u533A",
    "370405": "\u53F0\u513F\u5E84\u533A",
    "370406": "\u5C71\u4EAD\u533A",
    "370481": "\u6ED5\u5DDE\u5E02"
  },
  "370500": {
    "370501": "\u5E02\u8F96\u533A",
    "370502": "\u4E1C\u8425\u533A",
    "370503": "\u6CB3\u53E3\u533A",
    "370505": "\u57A6\u5229\u533A",
    "370522": "\u5229\u6D25\u53BF",
    "370523": "\u5E7F\u9976\u53BF",
    "370571": "\u4E1C\u8425\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "370572": "\u4E1C\u8425\u6E2F\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "370600": {
    "370601": "\u5E02\u8F96\u533A",
    "370602": "\u829D\u7F58\u533A",
    "370611": "\u798F\u5C71\u533A",
    "370612": "\u725F\u5E73\u533A",
    "370613": "\u83B1\u5C71\u533A",
    "370634": "\u957F\u5C9B\u53BF",
    "370671": "\u70DF\u53F0\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "370672": "\u70DF\u53F0\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "370681": "\u9F99\u53E3\u5E02",
    "370682": "\u83B1\u9633\u5E02",
    "370683": "\u83B1\u5DDE\u5E02",
    "370684": "\u84EC\u83B1\u5E02",
    "370685": "\u62DB\u8FDC\u5E02",
    "370686": "\u6816\u971E\u5E02",
    "370687": "\u6D77\u9633\u5E02"
  },
  "370700": {
    "370701": "\u5E02\u8F96\u533A",
    "370702": "\u6F4D\u57CE\u533A",
    "370703": "\u5BD2\u4EAD\u533A",
    "370704": "\u574A\u5B50\u533A",
    "370705": "\u594E\u6587\u533A",
    "370724": "\u4E34\u6710\u53BF",
    "370725": "\u660C\u4E50\u53BF",
    "370772": "\u6F4D\u574A\u6EE8\u6D77\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "370781": "\u9752\u5DDE\u5E02",
    "370782": "\u8BF8\u57CE\u5E02",
    "370783": "\u5BFF\u5149\u5E02",
    "370784": "\u5B89\u4E18\u5E02",
    "370785": "\u9AD8\u5BC6\u5E02",
    "370786": "\u660C\u9091\u5E02"
  },
  "370800": {
    "370801": "\u5E02\u8F96\u533A",
    "370811": "\u4EFB\u57CE\u533A",
    "370812": "\u5156\u5DDE\u533A",
    "370826": "\u5FAE\u5C71\u53BF",
    "370827": "\u9C7C\u53F0\u53BF",
    "370828": "\u91D1\u4E61\u53BF",
    "370829": "\u5609\u7965\u53BF",
    "370830": "\u6C76\u4E0A\u53BF",
    "370831": "\u6CD7\u6C34\u53BF",
    "370832": "\u6881\u5C71\u53BF",
    "370871": "\u6D4E\u5B81\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "370881": "\u66F2\u961C\u5E02",
    "370883": "\u90B9\u57CE\u5E02"
  },
  "370900": {
    "370901": "\u5E02\u8F96\u533A",
    "370902": "\u6CF0\u5C71\u533A",
    "370911": "\u5CB1\u5CB3\u533A",
    "370921": "\u5B81\u9633\u53BF",
    "370923": "\u4E1C\u5E73\u53BF",
    "370982": "\u65B0\u6CF0\u5E02",
    "370983": "\u80A5\u57CE\u5E02"
  },
  "371000": {
    "371001": "\u5E02\u8F96\u533A",
    "371002": "\u73AF\u7FE0\u533A",
    "371003": "\u6587\u767B\u533A",
    "371071": "\u5A01\u6D77\u706B\u70AC\u9AD8\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "371072": "\u5A01\u6D77\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "371073": "\u5A01\u6D77\u4E34\u6E2F\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "371082": "\u8363\u6210\u5E02",
    "371083": "\u4E73\u5C71\u5E02"
  },
  "371100": {
    "371101": "\u5E02\u8F96\u533A",
    "371102": "\u4E1C\u6E2F\u533A",
    "371103": "\u5C9A\u5C71\u533A",
    "371121": "\u4E94\u83B2\u53BF",
    "371122": "\u8392\u53BF",
    "371171": "\u65E5\u7167\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "371300": {
    "371301": "\u5E02\u8F96\u533A",
    "371302": "\u5170\u5C71\u533A",
    "371311": "\u7F57\u5E84\u533A",
    "371312": "\u6CB3\u4E1C\u533A",
    "371321": "\u6C82\u5357\u53BF",
    "371322": "\u90EF\u57CE\u53BF",
    "371323": "\u6C82\u6C34\u53BF",
    "371324": "\u5170\u9675\u53BF",
    "371325": "\u8D39\u53BF",
    "371326": "\u5E73\u9091\u53BF",
    "371327": "\u8392\u5357\u53BF",
    "371328": "\u8499\u9634\u53BF",
    "371329": "\u4E34\u6CAD\u53BF",
    "371371": "\u4E34\u6C82\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "371372": "\u4E34\u6C82\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "371373": "\u4E34\u6C82\u4E34\u6E2F\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "371400": {
    "371401": "\u5E02\u8F96\u533A",
    "371402": "\u5FB7\u57CE\u533A",
    "371403": "\u9675\u57CE\u533A",
    "371422": "\u5B81\u6D25\u53BF",
    "371423": "\u5E86\u4E91\u53BF",
    "371424": "\u4E34\u9091\u53BF",
    "371425": "\u9F50\u6CB3\u53BF",
    "371426": "\u5E73\u539F\u53BF",
    "371427": "\u590F\u6D25\u53BF",
    "371428": "\u6B66\u57CE\u53BF",
    "371471": "\u5FB7\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "371472": "\u5FB7\u5DDE\u8FD0\u6CB3\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "371481": "\u4E50\u9675\u5E02",
    "371482": "\u79B9\u57CE\u5E02"
  },
  "371500": {
    "371501": "\u5E02\u8F96\u533A",
    "371502": "\u4E1C\u660C\u5E9C\u533A",
    "371503": "\u830C\u5E73\u533A",
    "371521": "\u9633\u8C37\u53BF",
    "371522": "\u8398\u53BF",
    "371524": "\u4E1C\u963F\u53BF",
    "371525": "\u51A0\u53BF",
    "371526": "\u9AD8\u5510\u53BF",
    "371581": "\u4E34\u6E05\u5E02"
  },
  "371600": {
    "371601": "\u5E02\u8F96\u533A",
    "371602": "\u6EE8\u57CE\u533A",
    "371603": "\u6CBE\u5316\u533A",
    "371621": "\u60E0\u6C11\u53BF",
    "371622": "\u9633\u4FE1\u53BF",
    "371623": "\u65E0\u68E3\u53BF",
    "371625": "\u535A\u5174\u53BF",
    "371681": "\u90B9\u5E73\u5E02"
  },
  "371700": {
    "371701": "\u5E02\u8F96\u533A",
    "371702": "\u7261\u4E39\u533A",
    "371703": "\u5B9A\u9676\u533A",
    "371721": "\u66F9\u53BF",
    "371722": "\u5355\u53BF",
    "371723": "\u6210\u6B66\u53BF",
    "371724": "\u5DE8\u91CE\u53BF",
    "371725": "\u90D3\u57CE\u53BF",
    "371726": "\u9104\u57CE\u53BF",
    "371728": "\u4E1C\u660E\u53BF",
    "371771": "\u83CF\u6CFD\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "371772": "\u83CF\u6CFD\u9AD8\u65B0\u6280\u672F\u5F00\u53D1\u533A"
  },
  "410000": {
    "410100": "\u90D1\u5DDE\u5E02",
    "410200": "\u5F00\u5C01\u5E02",
    "410300": "\u6D1B\u9633\u5E02",
    "410400": "\u5E73\u9876\u5C71\u5E02",
    "410500": "\u5B89\u9633\u5E02",
    "410600": "\u9E64\u58C1\u5E02",
    "410700": "\u65B0\u4E61\u5E02",
    "410800": "\u7126\u4F5C\u5E02",
    "410900": "\u6FEE\u9633\u5E02",
    "411000": "\u8BB8\u660C\u5E02",
    "411100": "\u6F2F\u6CB3\u5E02",
    "411200": "\u4E09\u95E8\u5CE1\u5E02",
    "411300": "\u5357\u9633\u5E02",
    "411400": "\u5546\u4E18\u5E02",
    "411500": "\u4FE1\u9633\u5E02",
    "411600": "\u5468\u53E3\u5E02",
    "411700": "\u9A7B\u9A6C\u5E97\u5E02",
    "419000": "\u7701\u76F4\u8F96\u53BF\u7EA7\u884C\u653F\u533A\u5212"
  },
  "410100": {
    "410101": "\u5E02\u8F96\u533A",
    "410102": "\u4E2D\u539F\u533A",
    "410103": "\u4E8C\u4E03\u533A",
    "410104": "\u7BA1\u57CE\u56DE\u65CF\u533A",
    "410105": "\u91D1\u6C34\u533A",
    "410106": "\u4E0A\u8857\u533A",
    "410108": "\u60E0\u6D4E\u533A",
    "410122": "\u4E2D\u725F\u53BF",
    "410171": "\u90D1\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "410172": "\u90D1\u5DDE\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "410173": "\u90D1\u5DDE\u822A\u7A7A\u6E2F\u7ECF\u6D4E\u7EFC\u5408\u5B9E\u9A8C\u533A",
    "410181": "\u5DE9\u4E49\u5E02",
    "410182": "\u8365\u9633\u5E02",
    "410183": "\u65B0\u5BC6\u5E02",
    "410184": "\u65B0\u90D1\u5E02",
    "410185": "\u767B\u5C01\u5E02"
  },
  "410200": {
    "410201": "\u5E02\u8F96\u533A",
    "410202": "\u9F99\u4EAD\u533A",
    "410203": "\u987A\u6CB3\u56DE\u65CF\u533A",
    "410204": "\u9F13\u697C\u533A",
    "410205": "\u79B9\u738B\u53F0\u533A",
    "410212": "\u7965\u7B26\u533A",
    "410221": "\u675E\u53BF",
    "410222": "\u901A\u8BB8\u53BF",
    "410223": "\u5C09\u6C0F\u53BF",
    "410225": "\u5170\u8003\u53BF"
  },
  "410300": {
    "410301": "\u5E02\u8F96\u533A",
    "410302": "\u8001\u57CE\u533A",
    "410303": "\u897F\u5DE5\u533A",
    "410304": "\u700D\u6CB3\u56DE\u65CF\u533A",
    "410305": "\u6DA7\u897F\u533A",
    "410306": "\u5409\u5229\u533A",
    "410311": "\u6D1B\u9F99\u533A",
    "410322": "\u5B5F\u6D25\u53BF",
    "410323": "\u65B0\u5B89\u53BF",
    "410324": "\u683E\u5DDD\u53BF",
    "410325": "\u5D69\u53BF",
    "410326": "\u6C5D\u9633\u53BF",
    "410327": "\u5B9C\u9633\u53BF",
    "410328": "\u6D1B\u5B81\u53BF",
    "410329": "\u4F0A\u5DDD\u53BF",
    "410371": "\u6D1B\u9633\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "410381": "\u5043\u5E08\u5E02"
  },
  "410400": {
    "410401": "\u5E02\u8F96\u533A",
    "410402": "\u65B0\u534E\u533A",
    "410403": "\u536B\u4E1C\u533A",
    "410404": "\u77F3\u9F99\u533A",
    "410411": "\u6E5B\u6CB3\u533A",
    "410421": "\u5B9D\u4E30\u53BF",
    "410422": "\u53F6\u53BF",
    "410423": "\u9C81\u5C71\u53BF",
    "410425": "\u90CF\u53BF",
    "410471": "\u5E73\u9876\u5C71\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "410472": "\u5E73\u9876\u5C71\u5E02\u57CE\u4E61\u4E00\u4F53\u5316\u793A\u8303\u533A",
    "410481": "\u821E\u94A2\u5E02",
    "410482": "\u6C5D\u5DDE\u5E02"
  },
  "410500": {
    "410501": "\u5E02\u8F96\u533A",
    "410502": "\u6587\u5CF0\u533A",
    "410503": "\u5317\u5173\u533A",
    "410505": "\u6BB7\u90FD\u533A",
    "410506": "\u9F99\u5B89\u533A",
    "410522": "\u5B89\u9633\u53BF",
    "410523": "\u6C64\u9634\u53BF",
    "410526": "\u6ED1\u53BF",
    "410527": "\u5185\u9EC4\u53BF",
    "410571": "\u5B89\u9633\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "410581": "\u6797\u5DDE\u5E02"
  },
  "410600": {
    "410601": "\u5E02\u8F96\u533A",
    "410602": "\u9E64\u5C71\u533A",
    "410603": "\u5C71\u57CE\u533A",
    "410611": "\u6DC7\u6EE8\u533A",
    "410621": "\u6D5A\u53BF",
    "410622": "\u6DC7\u53BF",
    "410671": "\u9E64\u58C1\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "410700": {
    "410701": "\u5E02\u8F96\u533A",
    "410702": "\u7EA2\u65D7\u533A",
    "410703": "\u536B\u6EE8\u533A",
    "410704": "\u51E4\u6CC9\u533A",
    "410711": "\u7267\u91CE\u533A",
    "410721": "\u65B0\u4E61\u53BF",
    "410724": "\u83B7\u5609\u53BF",
    "410725": "\u539F\u9633\u53BF",
    "410726": "\u5EF6\u6D25\u53BF",
    "410727": "\u5C01\u4E18\u53BF",
    "410771": "\u65B0\u4E61\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "410772": "\u65B0\u4E61\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "410773": "\u65B0\u4E61\u5E02\u5E73\u539F\u57CE\u4E61\u4E00\u4F53\u5316\u793A\u8303\u533A",
    "410781": "\u536B\u8F89\u5E02",
    "410782": "\u8F89\u53BF\u5E02",
    "410783": "\u957F\u57A3\u5E02"
  },
  "410800": {
    "410801": "\u5E02\u8F96\u533A",
    "410802": "\u89E3\u653E\u533A",
    "410803": "\u4E2D\u7AD9\u533A",
    "410804": "\u9A6C\u6751\u533A",
    "410811": "\u5C71\u9633\u533A",
    "410821": "\u4FEE\u6B66\u53BF",
    "410822": "\u535A\u7231\u53BF",
    "410823": "\u6B66\u965F\u53BF",
    "410825": "\u6E29\u53BF",
    "410871": "\u7126\u4F5C\u57CE\u4E61\u4E00\u4F53\u5316\u793A\u8303\u533A",
    "410882": "\u6C81\u9633\u5E02",
    "410883": "\u5B5F\u5DDE\u5E02"
  },
  "410900": {
    "410901": "\u5E02\u8F96\u533A",
    "410902": "\u534E\u9F99\u533A",
    "410922": "\u6E05\u4E30\u53BF",
    "410923": "\u5357\u4E50\u53BF",
    "410926": "\u8303\u53BF",
    "410927": "\u53F0\u524D\u53BF",
    "410928": "\u6FEE\u9633\u53BF",
    "410971": "\u6CB3\u5357\u6FEE\u9633\u5DE5\u4E1A\u56ED\u533A",
    "410972": "\u6FEE\u9633\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "411000": {
    "411001": "\u5E02\u8F96\u533A",
    "411002": "\u9B4F\u90FD\u533A",
    "411003": "\u5EFA\u5B89\u533A",
    "411024": "\u9122\u9675\u53BF",
    "411025": "\u8944\u57CE\u53BF",
    "411071": "\u8BB8\u660C\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "411081": "\u79B9\u5DDE\u5E02",
    "411082": "\u957F\u845B\u5E02"
  },
  "411100": {
    "411101": "\u5E02\u8F96\u533A",
    "411102": "\u6E90\u6C47\u533A",
    "411103": "\u90FE\u57CE\u533A",
    "411104": "\u53EC\u9675\u533A",
    "411121": "\u821E\u9633\u53BF",
    "411122": "\u4E34\u988D\u53BF",
    "411171": "\u6F2F\u6CB3\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "411200": {
    "411201": "\u5E02\u8F96\u533A",
    "411202": "\u6E56\u6EE8\u533A",
    "411203": "\u9655\u5DDE\u533A",
    "411221": "\u6E11\u6C60\u53BF",
    "411224": "\u5362\u6C0F\u53BF",
    "411271": "\u6CB3\u5357\u4E09\u95E8\u5CE1\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "411281": "\u4E49\u9A6C\u5E02",
    "411282": "\u7075\u5B9D\u5E02"
  },
  "411300": {
    "411301": "\u5E02\u8F96\u533A",
    "411302": "\u5B9B\u57CE\u533A",
    "411303": "\u5367\u9F99\u533A",
    "411321": "\u5357\u53EC\u53BF",
    "411322": "\u65B9\u57CE\u53BF",
    "411323": "\u897F\u5CE1\u53BF",
    "411324": "\u9547\u5E73\u53BF",
    "411325": "\u5185\u4E61\u53BF",
    "411326": "\u6DC5\u5DDD\u53BF",
    "411327": "\u793E\u65D7\u53BF",
    "411328": "\u5510\u6CB3\u53BF",
    "411329": "\u65B0\u91CE\u53BF",
    "411330": "\u6850\u67CF\u53BF",
    "411371": "\u5357\u9633\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A",
    "411372": "\u5357\u9633\u5E02\u57CE\u4E61\u4E00\u4F53\u5316\u793A\u8303\u533A",
    "411381": "\u9093\u5DDE\u5E02"
  },
  "411400": {
    "411401": "\u5E02\u8F96\u533A",
    "411402": "\u6881\u56ED\u533A",
    "411403": "\u7762\u9633\u533A",
    "411421": "\u6C11\u6743\u53BF",
    "411422": "\u7762\u53BF",
    "411423": "\u5B81\u9675\u53BF",
    "411424": "\u67D8\u57CE\u53BF",
    "411425": "\u865E\u57CE\u53BF",
    "411426": "\u590F\u9091\u53BF",
    "411471": "\u8C6B\u4E1C\u7EFC\u5408\u7269\u6D41\u4EA7\u4E1A\u805A\u96C6\u533A",
    "411472": "\u6CB3\u5357\u5546\u4E18\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "411481": "\u6C38\u57CE\u5E02"
  },
  "411500": {
    "411501": "\u5E02\u8F96\u533A",
    "411502": "\u6D49\u6CB3\u533A",
    "411503": "\u5E73\u6865\u533A",
    "411521": "\u7F57\u5C71\u53BF",
    "411522": "\u5149\u5C71\u53BF",
    "411523": "\u65B0\u53BF",
    "411524": "\u5546\u57CE\u53BF",
    "411525": "\u56FA\u59CB\u53BF",
    "411526": "\u6F62\u5DDD\u53BF",
    "411527": "\u6DEE\u6EE8\u53BF",
    "411528": "\u606F\u53BF",
    "411571": "\u4FE1\u9633\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u5F00\u53D1\u533A"
  },
  "411600": {
    "411601": "\u5E02\u8F96\u533A",
    "411602": "\u5DDD\u6C47\u533A",
    "411603": "\u6DEE\u9633\u533A",
    "411621": "\u6276\u6C9F\u53BF",
    "411622": "\u897F\u534E\u53BF",
    "411623": "\u5546\u6C34\u53BF",
    "411624": "\u6C88\u4E18\u53BF",
    "411625": "\u90F8\u57CE\u53BF",
    "411627": "\u592A\u5EB7\u53BF",
    "411628": "\u9E7F\u9091\u53BF",
    "411671": "\u6CB3\u5357\u5468\u53E3\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "411681": "\u9879\u57CE\u5E02"
  },
  "411700": {
    "411701": "\u5E02\u8F96\u533A",
    "411702": "\u9A7F\u57CE\u533A",
    "411721": "\u897F\u5E73\u53BF",
    "411722": "\u4E0A\u8521\u53BF",
    "411723": "\u5E73\u8206\u53BF",
    "411724": "\u6B63\u9633\u53BF",
    "411725": "\u786E\u5C71\u53BF",
    "411726": "\u6CCC\u9633\u53BF",
    "411727": "\u6C5D\u5357\u53BF",
    "411728": "\u9042\u5E73\u53BF",
    "411729": "\u65B0\u8521\u53BF",
    "411771": "\u6CB3\u5357\u9A7B\u9A6C\u5E97\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "419000": {
    "419001": "\u6D4E\u6E90\u5E02"
  },
  "420000": {
    "420100": "\u6B66\u6C49\u5E02",
    "420200": "\u9EC4\u77F3\u5E02",
    "420300": "\u5341\u5830\u5E02",
    "420500": "\u5B9C\u660C\u5E02",
    "420600": "\u8944\u9633\u5E02",
    "420700": "\u9102\u5DDE\u5E02",
    "420800": "\u8346\u95E8\u5E02",
    "420900": "\u5B5D\u611F\u5E02",
    "421000": "\u8346\u5DDE\u5E02",
    "421100": "\u9EC4\u5188\u5E02",
    "421200": "\u54B8\u5B81\u5E02",
    "421300": "\u968F\u5DDE\u5E02",
    "422800": "\u6069\u65BD\u571F\u5BB6\u65CF\u82D7\u65CF\u81EA\u6CBB\u5DDE",
    "429000": "\u7701\u76F4\u8F96\u53BF\u7EA7\u884C\u653F\u533A\u5212"
  },
  "420100": {
    "420101": "\u5E02\u8F96\u533A",
    "420102": "\u6C5F\u5CB8\u533A",
    "420103": "\u6C5F\u6C49\u533A",
    "420104": "\u785A\u53E3\u533A",
    "420105": "\u6C49\u9633\u533A",
    "420106": "\u6B66\u660C\u533A",
    "420107": "\u9752\u5C71\u533A",
    "420111": "\u6D2A\u5C71\u533A",
    "420112": "\u4E1C\u897F\u6E56\u533A",
    "420113": "\u6C49\u5357\u533A",
    "420114": "\u8521\u7538\u533A",
    "420115": "\u6C5F\u590F\u533A",
    "420116": "\u9EC4\u9642\u533A",
    "420117": "\u65B0\u6D32\u533A"
  },
  "420200": {
    "420201": "\u5E02\u8F96\u533A",
    "420202": "\u9EC4\u77F3\u6E2F\u533A",
    "420203": "\u897F\u585E\u5C71\u533A",
    "420204": "\u4E0B\u9646\u533A",
    "420205": "\u94C1\u5C71\u533A",
    "420222": "\u9633\u65B0\u53BF",
    "420281": "\u5927\u51B6\u5E02"
  },
  "420300": {
    "420301": "\u5E02\u8F96\u533A",
    "420302": "\u8305\u7BAD\u533A",
    "420303": "\u5F20\u6E7E\u533A",
    "420304": "\u90E7\u9633\u533A",
    "420322": "\u90E7\u897F\u53BF",
    "420323": "\u7AF9\u5C71\u53BF",
    "420324": "\u7AF9\u6EAA\u53BF",
    "420325": "\u623F\u53BF",
    "420381": "\u4E39\u6C5F\u53E3\u5E02"
  },
  "420500": {
    "420501": "\u5E02\u8F96\u533A",
    "420502": "\u897F\u9675\u533A",
    "420503": "\u4F0D\u5BB6\u5C97\u533A",
    "420504": "\u70B9\u519B\u533A",
    "420505": "\u7307\u4EAD\u533A",
    "420506": "\u5937\u9675\u533A",
    "420525": "\u8FDC\u5B89\u53BF",
    "420526": "\u5174\u5C71\u53BF",
    "420527": "\u79ED\u5F52\u53BF",
    "420528": "\u957F\u9633\u571F\u5BB6\u65CF\u81EA\u6CBB\u53BF",
    "420529": "\u4E94\u5CF0\u571F\u5BB6\u65CF\u81EA\u6CBB\u53BF",
    "420581": "\u5B9C\u90FD\u5E02",
    "420582": "\u5F53\u9633\u5E02",
    "420583": "\u679D\u6C5F\u5E02"
  },
  "420600": {
    "420601": "\u5E02\u8F96\u533A",
    "420602": "\u8944\u57CE\u533A",
    "420606": "\u6A0A\u57CE\u533A",
    "420607": "\u8944\u5DDE\u533A",
    "420624": "\u5357\u6F33\u53BF",
    "420625": "\u8C37\u57CE\u53BF",
    "420626": "\u4FDD\u5EB7\u53BF",
    "420682": "\u8001\u6CB3\u53E3\u5E02",
    "420683": "\u67A3\u9633\u5E02",
    "420684": "\u5B9C\u57CE\u5E02"
  },
  "420700": {
    "420701": "\u5E02\u8F96\u533A",
    "420702": "\u6881\u5B50\u6E56\u533A",
    "420703": "\u534E\u5BB9\u533A",
    "420704": "\u9102\u57CE\u533A"
  },
  "420800": {
    "420801": "\u5E02\u8F96\u533A",
    "420802": "\u4E1C\u5B9D\u533A",
    "420804": "\u6387\u5200\u533A",
    "420822": "\u6C99\u6D0B\u53BF",
    "420881": "\u949F\u7965\u5E02",
    "420882": "\u4EAC\u5C71\u5E02"
  },
  "420900": {
    "420901": "\u5E02\u8F96\u533A",
    "420902": "\u5B5D\u5357\u533A",
    "420921": "\u5B5D\u660C\u53BF",
    "420922": "\u5927\u609F\u53BF",
    "420923": "\u4E91\u68A6\u53BF",
    "420981": "\u5E94\u57CE\u5E02",
    "420982": "\u5B89\u9646\u5E02",
    "420984": "\u6C49\u5DDD\u5E02"
  },
  "421000": {
    "421001": "\u5E02\u8F96\u533A",
    "421002": "\u6C99\u5E02\u533A",
    "421003": "\u8346\u5DDE\u533A",
    "421022": "\u516C\u5B89\u53BF",
    "421023": "\u76D1\u5229\u53BF",
    "421024": "\u6C5F\u9675\u53BF",
    "421071": "\u8346\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "421081": "\u77F3\u9996\u5E02",
    "421083": "\u6D2A\u6E56\u5E02",
    "421087": "\u677E\u6ECB\u5E02"
  },
  "421100": {
    "421101": "\u5E02\u8F96\u533A",
    "421102": "\u9EC4\u5DDE\u533A",
    "421121": "\u56E2\u98CE\u53BF",
    "421122": "\u7EA2\u5B89\u53BF",
    "421123": "\u7F57\u7530\u53BF",
    "421124": "\u82F1\u5C71\u53BF",
    "421125": "\u6D60\u6C34\u53BF",
    "421126": "\u8572\u6625\u53BF",
    "421127": "\u9EC4\u6885\u53BF",
    "421171": "\u9F99\u611F\u6E56\u7BA1\u7406\u533A",
    "421181": "\u9EBB\u57CE\u5E02",
    "421182": "\u6B66\u7A74\u5E02"
  },
  "421200": {
    "421201": "\u5E02\u8F96\u533A",
    "421202": "\u54B8\u5B89\u533A",
    "421221": "\u5609\u9C7C\u53BF",
    "421222": "\u901A\u57CE\u53BF",
    "421223": "\u5D07\u9633\u53BF",
    "421224": "\u901A\u5C71\u53BF",
    "421281": "\u8D64\u58C1\u5E02"
  },
  "421300": {
    "421301": "\u5E02\u8F96\u533A",
    "421303": "\u66FE\u90FD\u533A",
    "421321": "\u968F\u53BF",
    "421381": "\u5E7F\u6C34\u5E02"
  },
  "422800": {
    "422801": "\u6069\u65BD\u5E02",
    "422802": "\u5229\u5DDD\u5E02",
    "422822": "\u5EFA\u59CB\u53BF",
    "422823": "\u5DF4\u4E1C\u53BF",
    "422825": "\u5BA3\u6069\u53BF",
    "422826": "\u54B8\u4E30\u53BF",
    "422827": "\u6765\u51E4\u53BF",
    "422828": "\u9E64\u5CF0\u53BF"
  },
  "429000": {
    "429004": "\u4ED9\u6843\u5E02",
    "429005": "\u6F5C\u6C5F\u5E02",
    "429006": "\u5929\u95E8\u5E02",
    "429021": "\u795E\u519C\u67B6\u6797\u533A"
  },
  "430000": {
    "430100": "\u957F\u6C99\u5E02",
    "430200": "\u682A\u6D32\u5E02",
    "430300": "\u6E58\u6F6D\u5E02",
    "430400": "\u8861\u9633\u5E02",
    "430500": "\u90B5\u9633\u5E02",
    "430600": "\u5CB3\u9633\u5E02",
    "430700": "\u5E38\u5FB7\u5E02",
    "430800": "\u5F20\u5BB6\u754C\u5E02",
    "430900": "\u76CA\u9633\u5E02",
    "431000": "\u90F4\u5DDE\u5E02",
    "431100": "\u6C38\u5DDE\u5E02",
    "431200": "\u6000\u5316\u5E02",
    "431300": "\u5A04\u5E95\u5E02",
    "433100": "\u6E58\u897F\u571F\u5BB6\u65CF\u82D7\u65CF\u81EA\u6CBB\u5DDE"
  },
  "430100": {
    "430101": "\u5E02\u8F96\u533A",
    "430102": "\u8299\u84C9\u533A",
    "430103": "\u5929\u5FC3\u533A",
    "430104": "\u5CB3\u9E93\u533A",
    "430105": "\u5F00\u798F\u533A",
    "430111": "\u96E8\u82B1\u533A",
    "430112": "\u671B\u57CE\u533A",
    "430121": "\u957F\u6C99\u53BF",
    "430181": "\u6D4F\u9633\u5E02",
    "430182": "\u5B81\u4E61\u5E02"
  },
  "430200": {
    "430201": "\u5E02\u8F96\u533A",
    "430202": "\u8377\u5858\u533A",
    "430203": "\u82A6\u6DDE\u533A",
    "430204": "\u77F3\u5CF0\u533A",
    "430211": "\u5929\u5143\u533A",
    "430212": "\u6E0C\u53E3\u533A",
    "430223": "\u6538\u53BF",
    "430224": "\u8336\u9675\u53BF",
    "430225": "\u708E\u9675\u53BF",
    "430271": "\u4E91\u9F99\u793A\u8303\u533A",
    "430281": "\u91B4\u9675\u5E02"
  },
  "430300": {
    "430301": "\u5E02\u8F96\u533A",
    "430302": "\u96E8\u6E56\u533A",
    "430304": "\u5CB3\u5858\u533A",
    "430321": "\u6E58\u6F6D\u53BF",
    "430371": "\u6E56\u5357\u6E58\u6F6D\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u56ED\u533A",
    "430372": "\u6E58\u6F6D\u662D\u5C71\u793A\u8303\u533A",
    "430373": "\u6E58\u6F6D\u4E5D\u534E\u793A\u8303\u533A",
    "430381": "\u6E58\u4E61\u5E02",
    "430382": "\u97F6\u5C71\u5E02"
  },
  "430400": {
    "430401": "\u5E02\u8F96\u533A",
    "430405": "\u73E0\u6656\u533A",
    "430406": "\u96C1\u5CF0\u533A",
    "430407": "\u77F3\u9F13\u533A",
    "430408": "\u84B8\u6E58\u533A",
    "430412": "\u5357\u5CB3\u533A",
    "430421": "\u8861\u9633\u53BF",
    "430422": "\u8861\u5357\u53BF",
    "430423": "\u8861\u5C71\u53BF",
    "430424": "\u8861\u4E1C\u53BF",
    "430426": "\u7941\u4E1C\u53BF",
    "430471": "\u8861\u9633\u7EFC\u5408\u4FDD\u7A0E\u533A",
    "430472": "\u6E56\u5357\u8861\u9633\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u56ED\u533A",
    "430473": "\u6E56\u5357\u8861\u9633\u677E\u6728\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "430481": "\u8012\u9633\u5E02",
    "430482": "\u5E38\u5B81\u5E02"
  },
  "430500": {
    "430501": "\u5E02\u8F96\u533A",
    "430502": "\u53CC\u6E05\u533A",
    "430503": "\u5927\u7965\u533A",
    "430511": "\u5317\u5854\u533A",
    "430522": "\u65B0\u90B5\u53BF",
    "430523": "\u90B5\u9633\u53BF",
    "430524": "\u9686\u56DE\u53BF",
    "430525": "\u6D1E\u53E3\u53BF",
    "430527": "\u7EE5\u5B81\u53BF",
    "430528": "\u65B0\u5B81\u53BF",
    "430529": "\u57CE\u6B65\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "430581": "\u6B66\u5188\u5E02",
    "430582": "\u90B5\u4E1C\u5E02"
  },
  "430600": {
    "430601": "\u5E02\u8F96\u533A",
    "430602": "\u5CB3\u9633\u697C\u533A",
    "430603": "\u4E91\u6EAA\u533A",
    "430611": "\u541B\u5C71\u533A",
    "430621": "\u5CB3\u9633\u53BF",
    "430623": "\u534E\u5BB9\u53BF",
    "430624": "\u6E58\u9634\u53BF",
    "430626": "\u5E73\u6C5F\u53BF",
    "430671": "\u5CB3\u9633\u5E02\u5C48\u539F\u7BA1\u7406\u533A",
    "430681": "\u6C68\u7F57\u5E02",
    "430682": "\u4E34\u6E58\u5E02"
  },
  "430700": {
    "430701": "\u5E02\u8F96\u533A",
    "430702": "\u6B66\u9675\u533A",
    "430703": "\u9F0E\u57CE\u533A",
    "430721": "\u5B89\u4E61\u53BF",
    "430722": "\u6C49\u5BFF\u53BF",
    "430723": "\u6FA7\u53BF",
    "430724": "\u4E34\u6FA7\u53BF",
    "430725": "\u6843\u6E90\u53BF",
    "430726": "\u77F3\u95E8\u53BF",
    "430771": "\u5E38\u5FB7\u5E02\u897F\u6D1E\u5EAD\u7BA1\u7406\u533A",
    "430781": "\u6D25\u5E02\u5E02"
  },
  "430800": {
    "430801": "\u5E02\u8F96\u533A",
    "430802": "\u6C38\u5B9A\u533A",
    "430811": "\u6B66\u9675\u6E90\u533A",
    "430821": "\u6148\u5229\u53BF",
    "430822": "\u6851\u690D\u53BF"
  },
  "430900": {
    "430901": "\u5E02\u8F96\u533A",
    "430902": "\u8D44\u9633\u533A",
    "430903": "\u8D6B\u5C71\u533A",
    "430921": "\u5357\u53BF",
    "430922": "\u6843\u6C5F\u53BF",
    "430923": "\u5B89\u5316\u53BF",
    "430971": "\u76CA\u9633\u5E02\u5927\u901A\u6E56\u7BA1\u7406\u533A",
    "430972": "\u6E56\u5357\u76CA\u9633\u9AD8\u65B0\u6280\u672F\u4EA7\u4E1A\u56ED\u533A",
    "430981": "\u6C85\u6C5F\u5E02"
  },
  "431000": {
    "431001": "\u5E02\u8F96\u533A",
    "431002": "\u5317\u6E56\u533A",
    "431003": "\u82CF\u4ED9\u533A",
    "431021": "\u6842\u9633\u53BF",
    "431022": "\u5B9C\u7AE0\u53BF",
    "431023": "\u6C38\u5174\u53BF",
    "431024": "\u5609\u79BE\u53BF",
    "431025": "\u4E34\u6B66\u53BF",
    "431026": "\u6C5D\u57CE\u53BF",
    "431027": "\u6842\u4E1C\u53BF",
    "431028": "\u5B89\u4EC1\u53BF",
    "431081": "\u8D44\u5174\u5E02"
  },
  "431100": {
    "431101": "\u5E02\u8F96\u533A",
    "431102": "\u96F6\u9675\u533A",
    "431103": "\u51B7\u6C34\u6EE9\u533A",
    "431121": "\u7941\u9633\u53BF",
    "431122": "\u4E1C\u5B89\u53BF",
    "431123": "\u53CC\u724C\u53BF",
    "431124": "\u9053\u53BF",
    "431125": "\u6C5F\u6C38\u53BF",
    "431126": "\u5B81\u8FDC\u53BF",
    "431127": "\u84DD\u5C71\u53BF",
    "431128": "\u65B0\u7530\u53BF",
    "431129": "\u6C5F\u534E\u7476\u65CF\u81EA\u6CBB\u53BF",
    "431171": "\u6C38\u5DDE\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "431172": "\u6C38\u5DDE\u5E02\u91D1\u6D1E\u7BA1\u7406\u533A",
    "431173": "\u6C38\u5DDE\u5E02\u56DE\u9F99\u5729\u7BA1\u7406\u533A"
  },
  "431200": {
    "431201": "\u5E02\u8F96\u533A",
    "431202": "\u9E64\u57CE\u533A",
    "431221": "\u4E2D\u65B9\u53BF",
    "431222": "\u6C85\u9675\u53BF",
    "431223": "\u8FB0\u6EAA\u53BF",
    "431224": "\u6E86\u6D66\u53BF",
    "431225": "\u4F1A\u540C\u53BF",
    "431226": "\u9EBB\u9633\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "431227": "\u65B0\u6643\u4F97\u65CF\u81EA\u6CBB\u53BF",
    "431228": "\u82B7\u6C5F\u4F97\u65CF\u81EA\u6CBB\u53BF",
    "431229": "\u9756\u5DDE\u82D7\u65CF\u4F97\u65CF\u81EA\u6CBB\u53BF",
    "431230": "\u901A\u9053\u4F97\u65CF\u81EA\u6CBB\u53BF",
    "431271": "\u6000\u5316\u5E02\u6D2A\u6C5F\u7BA1\u7406\u533A",
    "431281": "\u6D2A\u6C5F\u5E02"
  },
  "431300": {
    "431301": "\u5E02\u8F96\u533A",
    "431302": "\u5A04\u661F\u533A",
    "431321": "\u53CC\u5CF0\u53BF",
    "431322": "\u65B0\u5316\u53BF",
    "431381": "\u51B7\u6C34\u6C5F\u5E02",
    "431382": "\u6D9F\u6E90\u5E02"
  },
  "433100": {
    "433101": "\u5409\u9996\u5E02",
    "433122": "\u6CF8\u6EAA\u53BF",
    "433123": "\u51E4\u51F0\u53BF",
    "433124": "\u82B1\u57A3\u53BF",
    "433125": "\u4FDD\u9756\u53BF",
    "433126": "\u53E4\u4E08\u53BF",
    "433127": "\u6C38\u987A\u53BF",
    "433130": "\u9F99\u5C71\u53BF",
    "433173": "\u6E56\u5357\u6C38\u987A\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "440000": {
    "440100": "\u5E7F\u5DDE\u5E02",
    "440200": "\u97F6\u5173\u5E02",
    "440300": "\u6DF1\u5733\u5E02",
    "440400": "\u73E0\u6D77\u5E02",
    "440500": "\u6C55\u5934\u5E02",
    "440600": "\u4F5B\u5C71\u5E02",
    "440700": "\u6C5F\u95E8\u5E02",
    "440800": "\u6E5B\u6C5F\u5E02",
    "440900": "\u8302\u540D\u5E02",
    "441200": "\u8087\u5E86\u5E02",
    "441300": "\u60E0\u5DDE\u5E02",
    "441400": "\u6885\u5DDE\u5E02",
    "441500": "\u6C55\u5C3E\u5E02",
    "441600": "\u6CB3\u6E90\u5E02",
    "441700": "\u9633\u6C5F\u5E02",
    "441800": "\u6E05\u8FDC\u5E02",
    "441900": "\u4E1C\u839E\u5E02",
    "442000": "\u4E2D\u5C71\u5E02",
    "445100": "\u6F6E\u5DDE\u5E02",
    "445200": "\u63ED\u9633\u5E02",
    "445300": "\u4E91\u6D6E\u5E02"
  },
  "440100": {
    "440101": "\u5E02\u8F96\u533A",
    "440103": "\u8354\u6E7E\u533A",
    "440104": "\u8D8A\u79C0\u533A",
    "440105": "\u6D77\u73E0\u533A",
    "440106": "\u5929\u6CB3\u533A",
    "440111": "\u767D\u4E91\u533A",
    "440112": "\u9EC4\u57D4\u533A",
    "440113": "\u756A\u79BA\u533A",
    "440114": "\u82B1\u90FD\u533A",
    "440115": "\u5357\u6C99\u533A",
    "440117": "\u4ECE\u5316\u533A",
    "440118": "\u589E\u57CE\u533A"
  },
  "440200": {
    "440201": "\u5E02\u8F96\u533A",
    "440203": "\u6B66\u6C5F\u533A",
    "440204": "\u6D48\u6C5F\u533A",
    "440205": "\u66F2\u6C5F\u533A",
    "440222": "\u59CB\u5174\u53BF",
    "440224": "\u4EC1\u5316\u53BF",
    "440229": "\u7FC1\u6E90\u53BF",
    "440232": "\u4E73\u6E90\u7476\u65CF\u81EA\u6CBB\u53BF",
    "440233": "\u65B0\u4E30\u53BF",
    "440281": "\u4E50\u660C\u5E02",
    "440282": "\u5357\u96C4\u5E02"
  },
  "440300": {
    "440301": "\u5E02\u8F96\u533A",
    "440303": "\u7F57\u6E56\u533A",
    "440304": "\u798F\u7530\u533A",
    "440305": "\u5357\u5C71\u533A",
    "440306": "\u5B9D\u5B89\u533A",
    "440307": "\u9F99\u5C97\u533A",
    "440308": "\u76D0\u7530\u533A",
    "440309": "\u9F99\u534E\u533A",
    "440310": "\u576A\u5C71\u533A",
    "440311": "\u5149\u660E\u533A"
  },
  "440400": {
    "440401": "\u5E02\u8F96\u533A",
    "440402": "\u9999\u6D32\u533A",
    "440403": "\u6597\u95E8\u533A",
    "440404": "\u91D1\u6E7E\u533A"
  },
  "440500": {
    "440501": "\u5E02\u8F96\u533A",
    "440507": "\u9F99\u6E56\u533A",
    "440511": "\u91D1\u5E73\u533A",
    "440512": "\u6FE0\u6C5F\u533A",
    "440513": "\u6F6E\u9633\u533A",
    "440514": "\u6F6E\u5357\u533A",
    "440515": "\u6F84\u6D77\u533A",
    "440523": "\u5357\u6FB3\u53BF"
  },
  "440600": {
    "440601": "\u5E02\u8F96\u533A",
    "440604": "\u7985\u57CE\u533A",
    "440605": "\u5357\u6D77\u533A",
    "440606": "\u987A\u5FB7\u533A",
    "440607": "\u4E09\u6C34\u533A",
    "440608": "\u9AD8\u660E\u533A"
  },
  "440700": {
    "440701": "\u5E02\u8F96\u533A",
    "440703": "\u84EC\u6C5F\u533A",
    "440704": "\u6C5F\u6D77\u533A",
    "440705": "\u65B0\u4F1A\u533A",
    "440781": "\u53F0\u5C71\u5E02",
    "440783": "\u5F00\u5E73\u5E02",
    "440784": "\u9E64\u5C71\u5E02",
    "440785": "\u6069\u5E73\u5E02"
  },
  "440800": {
    "440801": "\u5E02\u8F96\u533A",
    "440802": "\u8D64\u574E\u533A",
    "440803": "\u971E\u5C71\u533A",
    "440804": "\u5761\u5934\u533A",
    "440811": "\u9EBB\u7AE0\u533A",
    "440823": "\u9042\u6EAA\u53BF",
    "440825": "\u5F90\u95FB\u53BF",
    "440881": "\u5EC9\u6C5F\u5E02",
    "440882": "\u96F7\u5DDE\u5E02",
    "440883": "\u5434\u5DDD\u5E02"
  },
  "440900": {
    "440901": "\u5E02\u8F96\u533A",
    "440902": "\u8302\u5357\u533A",
    "440904": "\u7535\u767D\u533A",
    "440981": "\u9AD8\u5DDE\u5E02",
    "440982": "\u5316\u5DDE\u5E02",
    "440983": "\u4FE1\u5B9C\u5E02"
  },
  "441200": {
    "441201": "\u5E02\u8F96\u533A",
    "441202": "\u7AEF\u5DDE\u533A",
    "441203": "\u9F0E\u6E56\u533A",
    "441204": "\u9AD8\u8981\u533A",
    "441223": "\u5E7F\u5B81\u53BF",
    "441224": "\u6000\u96C6\u53BF",
    "441225": "\u5C01\u5F00\u53BF",
    "441226": "\u5FB7\u5E86\u53BF",
    "441284": "\u56DB\u4F1A\u5E02"
  },
  "441300": {
    "441301": "\u5E02\u8F96\u533A",
    "441302": "\u60E0\u57CE\u533A",
    "441303": "\u60E0\u9633\u533A",
    "441322": "\u535A\u7F57\u53BF",
    "441323": "\u60E0\u4E1C\u53BF",
    "441324": "\u9F99\u95E8\u53BF"
  },
  "441400": {
    "441401": "\u5E02\u8F96\u533A",
    "441402": "\u6885\u6C5F\u533A",
    "441403": "\u6885\u53BF\u533A",
    "441422": "\u5927\u57D4\u53BF",
    "441423": "\u4E30\u987A\u53BF",
    "441424": "\u4E94\u534E\u53BF",
    "441426": "\u5E73\u8FDC\u53BF",
    "441427": "\u8549\u5CAD\u53BF",
    "441481": "\u5174\u5B81\u5E02"
  },
  "441500": {
    "441501": "\u5E02\u8F96\u533A",
    "441502": "\u57CE\u533A",
    "441521": "\u6D77\u4E30\u53BF",
    "441523": "\u9646\u6CB3\u53BF",
    "441581": "\u9646\u4E30\u5E02"
  },
  "441600": {
    "441601": "\u5E02\u8F96\u533A",
    "441602": "\u6E90\u57CE\u533A",
    "441621": "\u7D2B\u91D1\u53BF",
    "441622": "\u9F99\u5DDD\u53BF",
    "441623": "\u8FDE\u5E73\u53BF",
    "441624": "\u548C\u5E73\u53BF",
    "441625": "\u4E1C\u6E90\u53BF"
  },
  "441700": {
    "441701": "\u5E02\u8F96\u533A",
    "441702": "\u6C5F\u57CE\u533A",
    "441704": "\u9633\u4E1C\u533A",
    "441721": "\u9633\u897F\u53BF",
    "441781": "\u9633\u6625\u5E02"
  },
  "441800": {
    "441801": "\u5E02\u8F96\u533A",
    "441802": "\u6E05\u57CE\u533A",
    "441803": "\u6E05\u65B0\u533A",
    "441821": "\u4F5B\u5188\u53BF",
    "441823": "\u9633\u5C71\u53BF",
    "441825": "\u8FDE\u5C71\u58EE\u65CF\u7476\u65CF\u81EA\u6CBB\u53BF",
    "441826": "\u8FDE\u5357\u7476\u65CF\u81EA\u6CBB\u53BF",
    "441881": "\u82F1\u5FB7\u5E02",
    "441882": "\u8FDE\u5DDE\u5E02"
  },
  "441900": {
    "441900003": "\u4E1C\u57CE\u8857\u9053",
    "441900004": "\u5357\u57CE\u8857\u9053",
    "441900005": "\u4E07\u6C5F\u8857\u9053",
    "441900006": "\u839E\u57CE\u8857\u9053",
    "441900101": "\u77F3\u78A3\u9547",
    "441900102": "\u77F3\u9F99\u9547",
    "441900103": "\u8336\u5C71\u9547",
    "441900104": "\u77F3\u6392\u9547",
    "441900105": "\u4F01\u77F3\u9547",
    "441900106": "\u6A2A\u6CA5\u9547",
    "441900107": "\u6865\u5934\u9547",
    "441900108": "\u8C22\u5C97\u9547",
    "441900109": "\u4E1C\u5751\u9547",
    "441900110": "\u5E38\u5E73\u9547",
    "441900111": "\u5BEE\u6B65\u9547",
    "441900112": "\u6A1F\u6728\u5934\u9547",
    "441900113": "\u5927\u6717\u9547",
    "441900114": "\u9EC4\u6C5F\u9547",
    "441900115": "\u6E05\u6EAA\u9547",
    "441900116": "\u5858\u53A6\u9547",
    "441900117": "\u51E4\u5C97\u9547",
    "441900118": "\u5927\u5CAD\u5C71\u9547",
    "441900119": "\u957F\u5B89\u9547",
    "441900121": "\u864E\u95E8\u9547",
    "441900122": "\u539A\u8857\u9547",
    "441900123": "\u6C99\u7530\u9547",
    "441900124": "\u9053\u6ED8\u9547",
    "441900125": "\u6D2A\u6885\u9547",
    "441900126": "\u9EBB\u6D8C\u9547",
    "441900127": "\u671B\u725B\u58A9\u9547",
    "441900128": "\u4E2D\u5802\u9547",
    "441900129": "\u9AD8\u57D7\u9547",
    "441900401": "\u677E\u5C71\u6E56",
    "441900402": "\u4E1C\u839E\u6E2F",
    "441900403": "\u4E1C\u839E\u751F\u6001\u56ED"
  },
  "442000": {
    "442000001": "\u77F3\u5C90\u8857\u9053",
    "442000002": "\u4E1C\u533A\u8857\u9053",
    "442000003": "\u4E2D\u5C71\u6E2F\u8857\u9053",
    "442000004": "\u897F\u533A\u8857\u9053",
    "442000005": "\u5357\u533A\u8857\u9053",
    "442000006": "\u4E94\u6842\u5C71\u8857\u9053",
    "442000100": "\u5C0F\u6984\u9547",
    "442000101": "\u9EC4\u5703\u9547",
    "442000102": "\u6C11\u4F17\u9547",
    "442000103": "\u4E1C\u51E4\u9547",
    "442000104": "\u4E1C\u5347\u9547",
    "442000105": "\u53E4\u9547\u9547",
    "442000106": "\u6C99\u6EAA\u9547",
    "442000107": "\u5766\u6D32\u9547",
    "442000108": "\u6E2F\u53E3\u9547",
    "442000109": "\u4E09\u89D2\u9547",
    "442000110": "\u6A2A\u680F\u9547",
    "442000111": "\u5357\u5934\u9547",
    "442000112": "\u961C\u6C99\u9547",
    "442000113": "\u5357\u6717\u9547",
    "442000114": "\u4E09\u4E61\u9547",
    "442000115": "\u677F\u8299\u9547",
    "442000116": "\u5927\u6D8C\u9547",
    "442000117": "\u795E\u6E7E\u9547"
  },
  "445100": {
    "445101": "\u5E02\u8F96\u533A",
    "445102": "\u6E58\u6865\u533A",
    "445103": "\u6F6E\u5B89\u533A",
    "445122": "\u9976\u5E73\u53BF"
  },
  "445200": {
    "445201": "\u5E02\u8F96\u533A",
    "445202": "\u6995\u57CE\u533A",
    "445203": "\u63ED\u4E1C\u533A",
    "445222": "\u63ED\u897F\u53BF",
    "445224": "\u60E0\u6765\u53BF",
    "445281": "\u666E\u5B81\u5E02"
  },
  "445300": {
    "445301": "\u5E02\u8F96\u533A",
    "445302": "\u4E91\u57CE\u533A",
    "445303": "\u4E91\u5B89\u533A",
    "445321": "\u65B0\u5174\u53BF",
    "445322": "\u90C1\u5357\u53BF",
    "445381": "\u7F57\u5B9A\u5E02"
  },
  "450000": {
    "450100": "\u5357\u5B81\u5E02",
    "450200": "\u67F3\u5DDE\u5E02",
    "450300": "\u6842\u6797\u5E02",
    "450400": "\u68A7\u5DDE\u5E02",
    "450500": "\u5317\u6D77\u5E02",
    "450600": "\u9632\u57CE\u6E2F\u5E02",
    "450700": "\u94A6\u5DDE\u5E02",
    "450800": "\u8D35\u6E2F\u5E02",
    "450900": "\u7389\u6797\u5E02",
    "451000": "\u767E\u8272\u5E02",
    "451100": "\u8D3A\u5DDE\u5E02",
    "451200": "\u6CB3\u6C60\u5E02",
    "451300": "\u6765\u5BBE\u5E02",
    "451400": "\u5D07\u5DE6\u5E02"
  },
  "450100": {
    "450101": "\u5E02\u8F96\u533A",
    "450102": "\u5174\u5B81\u533A",
    "450103": "\u9752\u79C0\u533A",
    "450105": "\u6C5F\u5357\u533A",
    "450107": "\u897F\u4E61\u5858\u533A",
    "450108": "\u826F\u5E86\u533A",
    "450109": "\u9095\u5B81\u533A",
    "450110": "\u6B66\u9E23\u533A",
    "450123": "\u9686\u5B89\u53BF",
    "450124": "\u9A6C\u5C71\u53BF",
    "450125": "\u4E0A\u6797\u53BF",
    "450126": "\u5BBE\u9633\u53BF",
    "450127": "\u6A2A\u53BF"
  },
  "450200": {
    "450201": "\u5E02\u8F96\u533A",
    "450202": "\u57CE\u4E2D\u533A",
    "450203": "\u9C7C\u5CF0\u533A",
    "450204": "\u67F3\u5357\u533A",
    "450205": "\u67F3\u5317\u533A",
    "450206": "\u67F3\u6C5F\u533A",
    "450222": "\u67F3\u57CE\u53BF",
    "450223": "\u9E7F\u5BE8\u53BF",
    "450224": "\u878D\u5B89\u53BF",
    "450225": "\u878D\u6C34\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "450226": "\u4E09\u6C5F\u4F97\u65CF\u81EA\u6CBB\u53BF"
  },
  "450300": {
    "450301": "\u5E02\u8F96\u533A",
    "450302": "\u79C0\u5CF0\u533A",
    "450303": "\u53E0\u5F69\u533A",
    "450304": "\u8C61\u5C71\u533A",
    "450305": "\u4E03\u661F\u533A",
    "450311": "\u96C1\u5C71\u533A",
    "450312": "\u4E34\u6842\u533A",
    "450321": "\u9633\u6714\u53BF",
    "450323": "\u7075\u5DDD\u53BF",
    "450324": "\u5168\u5DDE\u53BF",
    "450325": "\u5174\u5B89\u53BF",
    "450326": "\u6C38\u798F\u53BF",
    "450327": "\u704C\u9633\u53BF",
    "450328": "\u9F99\u80DC\u5404\u65CF\u81EA\u6CBB\u53BF",
    "450329": "\u8D44\u6E90\u53BF",
    "450330": "\u5E73\u4E50\u53BF",
    "450332": "\u606D\u57CE\u7476\u65CF\u81EA\u6CBB\u53BF",
    "450381": "\u8354\u6D66\u5E02"
  },
  "450400": {
    "450401": "\u5E02\u8F96\u533A",
    "450403": "\u4E07\u79C0\u533A",
    "450405": "\u957F\u6D32\u533A",
    "450406": "\u9F99\u5729\u533A",
    "450421": "\u82CD\u68A7\u53BF",
    "450422": "\u85E4\u53BF",
    "450423": "\u8499\u5C71\u53BF",
    "450481": "\u5C91\u6EAA\u5E02"
  },
  "450500": {
    "450501": "\u5E02\u8F96\u533A",
    "450502": "\u6D77\u57CE\u533A",
    "450503": "\u94F6\u6D77\u533A",
    "450512": "\u94C1\u5C71\u6E2F\u533A",
    "450521": "\u5408\u6D66\u53BF"
  },
  "450600": {
    "450601": "\u5E02\u8F96\u533A",
    "450602": "\u6E2F\u53E3\u533A",
    "450603": "\u9632\u57CE\u533A",
    "450621": "\u4E0A\u601D\u53BF",
    "450681": "\u4E1C\u5174\u5E02"
  },
  "450700": {
    "450701": "\u5E02\u8F96\u533A",
    "450702": "\u94A6\u5357\u533A",
    "450703": "\u94A6\u5317\u533A",
    "450721": "\u7075\u5C71\u53BF",
    "450722": "\u6D66\u5317\u53BF"
  },
  "450800": {
    "450801": "\u5E02\u8F96\u533A",
    "450802": "\u6E2F\u5317\u533A",
    "450803": "\u6E2F\u5357\u533A",
    "450804": "\u8983\u5858\u533A",
    "450821": "\u5E73\u5357\u53BF",
    "450881": "\u6842\u5E73\u5E02"
  },
  "450900": {
    "450901": "\u5E02\u8F96\u533A",
    "450902": "\u7389\u5DDE\u533A",
    "450903": "\u798F\u7EF5\u533A",
    "450921": "\u5BB9\u53BF",
    "450922": "\u9646\u5DDD\u53BF",
    "450923": "\u535A\u767D\u53BF",
    "450924": "\u5174\u4E1A\u53BF",
    "450981": "\u5317\u6D41\u5E02"
  },
  "451000": {
    "451001": "\u5E02\u8F96\u533A",
    "451002": "\u53F3\u6C5F\u533A",
    "451003": "\u7530\u9633\u533A",
    "451022": "\u7530\u4E1C\u53BF",
    "451023": "\u5E73\u679C\u53BF",
    "451024": "\u5FB7\u4FDD\u53BF",
    "451026": "\u90A3\u5761\u53BF",
    "451027": "\u51CC\u4E91\u53BF",
    "451028": "\u4E50\u4E1A\u53BF",
    "451029": "\u7530\u6797\u53BF",
    "451030": "\u897F\u6797\u53BF",
    "451031": "\u9686\u6797\u5404\u65CF\u81EA\u6CBB\u53BF",
    "451081": "\u9756\u897F\u5E02"
  },
  "451100": {
    "451101": "\u5E02\u8F96\u533A",
    "451102": "\u516B\u6B65\u533A",
    "451103": "\u5E73\u6842\u533A",
    "451121": "\u662D\u5E73\u53BF",
    "451122": "\u949F\u5C71\u53BF",
    "451123": "\u5BCC\u5DDD\u7476\u65CF\u81EA\u6CBB\u53BF"
  },
  "451200": {
    "451201": "\u5E02\u8F96\u533A",
    "451202": "\u91D1\u57CE\u6C5F\u533A",
    "451203": "\u5B9C\u5DDE\u533A",
    "451221": "\u5357\u4E39\u53BF",
    "451222": "\u5929\u5CE8\u53BF",
    "451223": "\u51E4\u5C71\u53BF",
    "451224": "\u4E1C\u5170\u53BF",
    "451225": "\u7F57\u57CE\u4EEB\u4F6C\u65CF\u81EA\u6CBB\u53BF",
    "451226": "\u73AF\u6C5F\u6BDB\u5357\u65CF\u81EA\u6CBB\u53BF",
    "451227": "\u5DF4\u9A6C\u7476\u65CF\u81EA\u6CBB\u53BF",
    "451228": "\u90FD\u5B89\u7476\u65CF\u81EA\u6CBB\u53BF",
    "451229": "\u5927\u5316\u7476\u65CF\u81EA\u6CBB\u53BF"
  },
  "451300": {
    "451301": "\u5E02\u8F96\u533A",
    "451302": "\u5174\u5BBE\u533A",
    "451321": "\u5FFB\u57CE\u53BF",
    "451322": "\u8C61\u5DDE\u53BF",
    "451323": "\u6B66\u5BA3\u53BF",
    "451324": "\u91D1\u79C0\u7476\u65CF\u81EA\u6CBB\u53BF",
    "451381": "\u5408\u5C71\u5E02"
  },
  "451400": {
    "451401": "\u5E02\u8F96\u533A",
    "451402": "\u6C5F\u5DDE\u533A",
    "451421": "\u6276\u7EE5\u53BF",
    "451422": "\u5B81\u660E\u53BF",
    "451423": "\u9F99\u5DDE\u53BF",
    "451424": "\u5927\u65B0\u53BF",
    "451425": "\u5929\u7B49\u53BF",
    "451481": "\u51ED\u7965\u5E02"
  },
  "460000": {
    "460100": "\u6D77\u53E3\u5E02",
    "460200": "\u4E09\u4E9A\u5E02",
    "460300": "\u4E09\u6C99\u5E02",
    "460400": "\u510B\u5DDE\u5E02",
    "469000": "\u7701\u76F4\u8F96\u53BF\u7EA7\u884C\u653F\u533A\u5212"
  },
  "460100": {
    "460101": "\u5E02\u8F96\u533A",
    "460105": "\u79C0\u82F1\u533A",
    "460106": "\u9F99\u534E\u533A",
    "460107": "\u743C\u5C71\u533A",
    "460108": "\u7F8E\u5170\u533A"
  },
  "460200": {
    "460201": "\u5E02\u8F96\u533A",
    "460202": "\u6D77\u68E0\u533A",
    "460203": "\u5409\u9633\u533A",
    "460204": "\u5929\u6DAF\u533A",
    "460205": "\u5D16\u5DDE\u533A"
  },
  "460300": {
    "460321": "\u897F\u6C99\u7FA4\u5C9B",
    "460322": "\u5357\u6C99\u7FA4\u5C9B",
    "460323": "\u4E2D\u6C99\u7FA4\u5C9B\u7684\u5C9B\u7901\u53CA\u5176\u6D77\u57DF"
  },
  "460400": {
    "460400100": "\u90A3\u5927\u9547",
    "460400101": "\u548C\u5E86\u9547",
    "460400102": "\u5357\u4E30\u9547",
    "460400103": "\u5927\u6210\u9547",
    "460400104": "\u96C5\u661F\u9547",
    "460400105": "\u5170\u6D0B\u9547",
    "460400106": "\u5149\u6751\u9547",
    "460400107": "\u6728\u68E0\u9547",
    "460400108": "\u6D77\u5934\u9547",
    "460400109": "\u5CE8\u8513\u9547",
    "460400111": "\u738B\u4E94\u9547",
    "460400112": "\u767D\u9A6C\u4E95\u9547",
    "460400113": "\u4E2D\u548C\u9547",
    "460400114": "\u6392\u6D66\u9547",
    "460400115": "\u4E1C\u6210\u9547",
    "460400116": "\u65B0\u5DDE\u9547",
    "460400499": "\u6D0B\u6D66\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "460400500": "\u534E\u5357\u70ED\u4F5C\u5B66\u9662"
  },
  "469000": {
    "469001": "\u4E94\u6307\u5C71\u5E02",
    "469002": "\u743C\u6D77\u5E02",
    "469005": "\u6587\u660C\u5E02",
    "469006": "\u4E07\u5B81\u5E02",
    "469007": "\u4E1C\u65B9\u5E02",
    "469021": "\u5B9A\u5B89\u53BF",
    "469022": "\u5C6F\u660C\u53BF",
    "469023": "\u6F84\u8FC8\u53BF",
    "469024": "\u4E34\u9AD8\u53BF",
    "469025": "\u767D\u6C99\u9ECE\u65CF\u81EA\u6CBB\u53BF",
    "469026": "\u660C\u6C5F\u9ECE\u65CF\u81EA\u6CBB\u53BF",
    "469027": "\u4E50\u4E1C\u9ECE\u65CF\u81EA\u6CBB\u53BF",
    "469028": "\u9675\u6C34\u9ECE\u65CF\u81EA\u6CBB\u53BF",
    "469029": "\u4FDD\u4EAD\u9ECE\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "469030": "\u743C\u4E2D\u9ECE\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF"
  },
  "500000": {
    "500100": "\u5E02\u8F96\u533A",
    "500200": "\u53BF"
  },
  "500100": {
    "500101": "\u4E07\u5DDE\u533A",
    "500102": "\u6DAA\u9675\u533A",
    "500103": "\u6E1D\u4E2D\u533A",
    "500104": "\u5927\u6E21\u53E3\u533A",
    "500105": "\u6C5F\u5317\u533A",
    "500106": "\u6C99\u576A\u575D\u533A",
    "500107": "\u4E5D\u9F99\u5761\u533A",
    "500108": "\u5357\u5CB8\u533A",
    "500109": "\u5317\u789A\u533A",
    "500110": "\u7DA6\u6C5F\u533A",
    "500111": "\u5927\u8DB3\u533A",
    "500112": "\u6E1D\u5317\u533A",
    "500113": "\u5DF4\u5357\u533A",
    "500114": "\u9ED4\u6C5F\u533A",
    "500115": "\u957F\u5BFF\u533A",
    "500116": "\u6C5F\u6D25\u533A",
    "500117": "\u5408\u5DDD\u533A",
    "500118": "\u6C38\u5DDD\u533A",
    "500119": "\u5357\u5DDD\u533A",
    "500120": "\u74A7\u5C71\u533A",
    "500151": "\u94DC\u6881\u533A",
    "500152": "\u6F7C\u5357\u533A",
    "500153": "\u8363\u660C\u533A",
    "500154": "\u5F00\u5DDE\u533A",
    "500155": "\u6881\u5E73\u533A",
    "500156": "\u6B66\u9686\u533A"
  },
  "500200": {
    "500229": "\u57CE\u53E3\u53BF",
    "500230": "\u4E30\u90FD\u53BF",
    "500231": "\u57AB\u6C5F\u53BF",
    "500233": "\u5FE0\u53BF",
    "500235": "\u4E91\u9633\u53BF",
    "500236": "\u5949\u8282\u53BF",
    "500237": "\u5DEB\u5C71\u53BF",
    "500238": "\u5DEB\u6EAA\u53BF",
    "500240": "\u77F3\u67F1\u571F\u5BB6\u65CF\u81EA\u6CBB\u53BF",
    "500241": "\u79C0\u5C71\u571F\u5BB6\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "500242": "\u9149\u9633\u571F\u5BB6\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "500243": "\u5F6D\u6C34\u82D7\u65CF\u571F\u5BB6\u65CF\u81EA\u6CBB\u53BF"
  },
  "510000": {
    "510100": "\u6210\u90FD\u5E02",
    "510300": "\u81EA\u8D21\u5E02",
    "510400": "\u6500\u679D\u82B1\u5E02",
    "510500": "\u6CF8\u5DDE\u5E02",
    "510600": "\u5FB7\u9633\u5E02",
    "510700": "\u7EF5\u9633\u5E02",
    "510800": "\u5E7F\u5143\u5E02",
    "510900": "\u9042\u5B81\u5E02",
    "511000": "\u5185\u6C5F\u5E02",
    "511100": "\u4E50\u5C71\u5E02",
    "511300": "\u5357\u5145\u5E02",
    "511400": "\u7709\u5C71\u5E02",
    "511500": "\u5B9C\u5BBE\u5E02",
    "511600": "\u5E7F\u5B89\u5E02",
    "511700": "\u8FBE\u5DDE\u5E02",
    "511800": "\u96C5\u5B89\u5E02",
    "511900": "\u5DF4\u4E2D\u5E02",
    "512000": "\u8D44\u9633\u5E02",
    "513200": "\u963F\u575D\u85CF\u65CF\u7F8C\u65CF\u81EA\u6CBB\u5DDE",
    "513300": "\u7518\u5B5C\u85CF\u65CF\u81EA\u6CBB\u5DDE",
    "513400": "\u51C9\u5C71\u5F5D\u65CF\u81EA\u6CBB\u5DDE"
  },
  "510100": {
    "510101": "\u5E02\u8F96\u533A",
    "510104": "\u9526\u6C5F\u533A",
    "510105": "\u9752\u7F8A\u533A",
    "510106": "\u91D1\u725B\u533A",
    "510107": "\u6B66\u4FAF\u533A",
    "510108": "\u6210\u534E\u533A",
    "510112": "\u9F99\u6CC9\u9A7F\u533A",
    "510113": "\u9752\u767D\u6C5F\u533A",
    "510114": "\u65B0\u90FD\u533A",
    "510115": "\u6E29\u6C5F\u533A",
    "510116": "\u53CC\u6D41\u533A",
    "510117": "\u90EB\u90FD\u533A",
    "510121": "\u91D1\u5802\u53BF",
    "510129": "\u5927\u9091\u53BF",
    "510131": "\u84B2\u6C5F\u53BF",
    "510132": "\u65B0\u6D25\u53BF",
    "510181": "\u90FD\u6C5F\u5830\u5E02",
    "510182": "\u5F6D\u5DDE\u5E02",
    "510183": "\u909B\u5D03\u5E02",
    "510184": "\u5D07\u5DDE\u5E02",
    "510185": "\u7B80\u9633\u5E02"
  },
  "510300": {
    "510301": "\u5E02\u8F96\u533A",
    "510302": "\u81EA\u6D41\u4E95\u533A",
    "510303": "\u8D21\u4E95\u533A",
    "510304": "\u5927\u5B89\u533A",
    "510311": "\u6CBF\u6EE9\u533A",
    "510321": "\u8363\u53BF",
    "510322": "\u5BCC\u987A\u53BF"
  },
  "510400": {
    "510401": "\u5E02\u8F96\u533A",
    "510402": "\u4E1C\u533A",
    "510403": "\u897F\u533A",
    "510411": "\u4EC1\u548C\u533A",
    "510421": "\u7C73\u6613\u53BF",
    "510422": "\u76D0\u8FB9\u53BF"
  },
  "510500": {
    "510501": "\u5E02\u8F96\u533A",
    "510502": "\u6C5F\u9633\u533A",
    "510503": "\u7EB3\u6EAA\u533A",
    "510504": "\u9F99\u9A6C\u6F6D\u533A",
    "510521": "\u6CF8\u53BF",
    "510522": "\u5408\u6C5F\u53BF",
    "510524": "\u53D9\u6C38\u53BF",
    "510525": "\u53E4\u853A\u53BF"
  },
  "510600": {
    "510601": "\u5E02\u8F96\u533A",
    "510603": "\u65CC\u9633\u533A",
    "510604": "\u7F57\u6C5F\u533A",
    "510623": "\u4E2D\u6C5F\u53BF",
    "510681": "\u5E7F\u6C49\u5E02",
    "510682": "\u4EC0\u90A1\u5E02",
    "510683": "\u7EF5\u7AF9\u5E02"
  },
  "510700": {
    "510701": "\u5E02\u8F96\u533A",
    "510703": "\u6DAA\u57CE\u533A",
    "510704": "\u6E38\u4ED9\u533A",
    "510705": "\u5B89\u5DDE\u533A",
    "510722": "\u4E09\u53F0\u53BF",
    "510723": "\u76D0\u4EAD\u53BF",
    "510725": "\u6893\u6F7C\u53BF",
    "510726": "\u5317\u5DDD\u7F8C\u65CF\u81EA\u6CBB\u53BF",
    "510727": "\u5E73\u6B66\u53BF",
    "510781": "\u6C5F\u6CB9\u5E02"
  },
  "510800": {
    "510801": "\u5E02\u8F96\u533A",
    "510802": "\u5229\u5DDE\u533A",
    "510811": "\u662D\u5316\u533A",
    "510812": "\u671D\u5929\u533A",
    "510821": "\u65FA\u82CD\u53BF",
    "510822": "\u9752\u5DDD\u53BF",
    "510823": "\u5251\u9601\u53BF",
    "510824": "\u82CD\u6EAA\u53BF"
  },
  "510900": {
    "510901": "\u5E02\u8F96\u533A",
    "510903": "\u8239\u5C71\u533A",
    "510904": "\u5B89\u5C45\u533A",
    "510921": "\u84EC\u6EAA\u53BF",
    "510923": "\u5927\u82F1\u53BF",
    "510981": "\u5C04\u6D2A\u5E02"
  },
  "511000": {
    "511001": "\u5E02\u8F96\u533A",
    "511002": "\u5E02\u4E2D\u533A",
    "511011": "\u4E1C\u5174\u533A",
    "511024": "\u5A01\u8FDC\u53BF",
    "511025": "\u8D44\u4E2D\u53BF",
    "511071": "\u5185\u6C5F\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "511083": "\u9686\u660C\u5E02"
  },
  "511100": {
    "511101": "\u5E02\u8F96\u533A",
    "511102": "\u5E02\u4E2D\u533A",
    "511111": "\u6C99\u6E7E\u533A",
    "511112": "\u4E94\u901A\u6865\u533A",
    "511113": "\u91D1\u53E3\u6CB3\u533A",
    "511123": "\u728D\u4E3A\u53BF",
    "511124": "\u4E95\u7814\u53BF",
    "511126": "\u5939\u6C5F\u53BF",
    "511129": "\u6C90\u5DDD\u53BF",
    "511132": "\u5CE8\u8FB9\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "511133": "\u9A6C\u8FB9\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "511181": "\u5CE8\u7709\u5C71\u5E02"
  },
  "511300": {
    "511301": "\u5E02\u8F96\u533A",
    "511302": "\u987A\u5E86\u533A",
    "511303": "\u9AD8\u576A\u533A",
    "511304": "\u5609\u9675\u533A",
    "511321": "\u5357\u90E8\u53BF",
    "511322": "\u8425\u5C71\u53BF",
    "511323": "\u84EC\u5B89\u53BF",
    "511324": "\u4EEA\u9647\u53BF",
    "511325": "\u897F\u5145\u53BF",
    "511381": "\u9606\u4E2D\u5E02"
  },
  "511400": {
    "511401": "\u5E02\u8F96\u533A",
    "511402": "\u4E1C\u5761\u533A",
    "511403": "\u5F6D\u5C71\u533A",
    "511421": "\u4EC1\u5BFF\u53BF",
    "511423": "\u6D2A\u96C5\u53BF",
    "511424": "\u4E39\u68F1\u53BF",
    "511425": "\u9752\u795E\u53BF"
  },
  "511500": {
    "511501": "\u5E02\u8F96\u533A",
    "511502": "\u7FE0\u5C4F\u533A",
    "511503": "\u5357\u6EAA\u533A",
    "511504": "\u53D9\u5DDE\u533A",
    "511523": "\u6C5F\u5B89\u53BF",
    "511524": "\u957F\u5B81\u53BF",
    "511525": "\u9AD8\u53BF",
    "511526": "\u73D9\u53BF",
    "511527": "\u7B60\u8FDE\u53BF",
    "511528": "\u5174\u6587\u53BF",
    "511529": "\u5C4F\u5C71\u53BF"
  },
  "511600": {
    "511601": "\u5E02\u8F96\u533A",
    "511602": "\u5E7F\u5B89\u533A",
    "511603": "\u524D\u950B\u533A",
    "511621": "\u5CB3\u6C60\u53BF",
    "511622": "\u6B66\u80DC\u53BF",
    "511623": "\u90BB\u6C34\u53BF",
    "511681": "\u534E\u84E5\u5E02"
  },
  "511700": {
    "511701": "\u5E02\u8F96\u533A",
    "511702": "\u901A\u5DDD\u533A",
    "511703": "\u8FBE\u5DDD\u533A",
    "511722": "\u5BA3\u6C49\u53BF",
    "511723": "\u5F00\u6C5F\u53BF",
    "511724": "\u5927\u7AF9\u53BF",
    "511725": "\u6E20\u53BF",
    "511771": "\u8FBE\u5DDE\u7ECF\u6D4E\u5F00\u53D1\u533A",
    "511781": "\u4E07\u6E90\u5E02"
  },
  "511800": {
    "511801": "\u5E02\u8F96\u533A",
    "511802": "\u96E8\u57CE\u533A",
    "511803": "\u540D\u5C71\u533A",
    "511822": "\u8365\u7ECF\u53BF",
    "511823": "\u6C49\u6E90\u53BF",
    "511824": "\u77F3\u68C9\u53BF",
    "511825": "\u5929\u5168\u53BF",
    "511826": "\u82A6\u5C71\u53BF",
    "511827": "\u5B9D\u5174\u53BF"
  },
  "511900": {
    "511901": "\u5E02\u8F96\u533A",
    "511902": "\u5DF4\u5DDE\u533A",
    "511903": "\u6069\u9633\u533A",
    "511921": "\u901A\u6C5F\u53BF",
    "511922": "\u5357\u6C5F\u53BF",
    "511923": "\u5E73\u660C\u53BF",
    "511971": "\u5DF4\u4E2D\u7ECF\u6D4E\u5F00\u53D1\u533A"
  },
  "512000": {
    "512001": "\u5E02\u8F96\u533A",
    "512002": "\u96C1\u6C5F\u533A",
    "512021": "\u5B89\u5CB3\u53BF",
    "512022": "\u4E50\u81F3\u53BF"
  },
  "513200": {
    "513201": "\u9A6C\u5C14\u5EB7\u5E02",
    "513221": "\u6C76\u5DDD\u53BF",
    "513222": "\u7406\u53BF",
    "513223": "\u8302\u53BF",
    "513224": "\u677E\u6F58\u53BF",
    "513225": "\u4E5D\u5BE8\u6C9F\u53BF",
    "513226": "\u91D1\u5DDD\u53BF",
    "513227": "\u5C0F\u91D1\u53BF",
    "513228": "\u9ED1\u6C34\u53BF",
    "513230": "\u58E4\u5858\u53BF",
    "513231": "\u963F\u575D\u53BF",
    "513232": "\u82E5\u5C14\u76D6\u53BF",
    "513233": "\u7EA2\u539F\u53BF"
  },
  "513300": {
    "513301": "\u5EB7\u5B9A\u5E02",
    "513322": "\u6CF8\u5B9A\u53BF",
    "513323": "\u4E39\u5DF4\u53BF",
    "513324": "\u4E5D\u9F99\u53BF",
    "513325": "\u96C5\u6C5F\u53BF",
    "513326": "\u9053\u5B5A\u53BF",
    "513327": "\u7089\u970D\u53BF",
    "513328": "\u7518\u5B5C\u53BF",
    "513329": "\u65B0\u9F99\u53BF",
    "513330": "\u5FB7\u683C\u53BF",
    "513331": "\u767D\u7389\u53BF",
    "513332": "\u77F3\u6E20\u53BF",
    "513333": "\u8272\u8FBE\u53BF",
    "513334": "\u7406\u5858\u53BF",
    "513335": "\u5DF4\u5858\u53BF",
    "513336": "\u4E61\u57CE\u53BF",
    "513337": "\u7A3B\u57CE\u53BF",
    "513338": "\u5F97\u8363\u53BF"
  },
  "513400": {
    "513401": "\u897F\u660C\u5E02",
    "513422": "\u6728\u91CC\u85CF\u65CF\u81EA\u6CBB\u53BF",
    "513423": "\u76D0\u6E90\u53BF",
    "513424": "\u5FB7\u660C\u53BF",
    "513425": "\u4F1A\u7406\u53BF",
    "513426": "\u4F1A\u4E1C\u53BF",
    "513427": "\u5B81\u5357\u53BF",
    "513428": "\u666E\u683C\u53BF",
    "513429": "\u5E03\u62D6\u53BF",
    "513430": "\u91D1\u9633\u53BF",
    "513431": "\u662D\u89C9\u53BF",
    "513432": "\u559C\u5FB7\u53BF",
    "513433": "\u5195\u5B81\u53BF",
    "513434": "\u8D8A\u897F\u53BF",
    "513435": "\u7518\u6D1B\u53BF",
    "513436": "\u7F8E\u59D1\u53BF",
    "513437": "\u96F7\u6CE2\u53BF"
  },
  "520000": {
    "520100": "\u8D35\u9633\u5E02",
    "520200": "\u516D\u76D8\u6C34\u5E02",
    "520300": "\u9075\u4E49\u5E02",
    "520400": "\u5B89\u987A\u5E02",
    "520500": "\u6BD5\u8282\u5E02",
    "520600": "\u94DC\u4EC1\u5E02",
    "522300": "\u9ED4\u897F\u5357\u5E03\u4F9D\u65CF\u82D7\u65CF\u81EA\u6CBB\u5DDE",
    "522600": "\u9ED4\u4E1C\u5357\u82D7\u65CF\u4F97\u65CF\u81EA\u6CBB\u5DDE",
    "522700": "\u9ED4\u5357\u5E03\u4F9D\u65CF\u82D7\u65CF\u81EA\u6CBB\u5DDE"
  },
  "520100": {
    "520101": "\u5E02\u8F96\u533A",
    "520102": "\u5357\u660E\u533A",
    "520103": "\u4E91\u5CA9\u533A",
    "520111": "\u82B1\u6EAA\u533A",
    "520112": "\u4E4C\u5F53\u533A",
    "520113": "\u767D\u4E91\u533A",
    "520115": "\u89C2\u5C71\u6E56\u533A",
    "520121": "\u5F00\u9633\u53BF",
    "520122": "\u606F\u70FD\u53BF",
    "520123": "\u4FEE\u6587\u53BF",
    "520181": "\u6E05\u9547\u5E02"
  },
  "520200": {
    "520201": "\u949F\u5C71\u533A",
    "520203": "\u516D\u679D\u7279\u533A",
    "520221": "\u6C34\u57CE\u53BF",
    "520281": "\u76D8\u5DDE\u5E02"
  },
  "520300": {
    "520301": "\u5E02\u8F96\u533A",
    "520302": "\u7EA2\u82B1\u5C97\u533A",
    "520303": "\u6C47\u5DDD\u533A",
    "520304": "\u64AD\u5DDE\u533A",
    "520322": "\u6850\u6893\u53BF",
    "520323": "\u7EE5\u9633\u53BF",
    "520324": "\u6B63\u5B89\u53BF",
    "520325": "\u9053\u771F\u4EE1\u4F6C\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "520326": "\u52A1\u5DDD\u4EE1\u4F6C\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "520327": "\u51E4\u5188\u53BF",
    "520328": "\u6E44\u6F6D\u53BF",
    "520329": "\u4F59\u5E86\u53BF",
    "520330": "\u4E60\u6C34\u53BF",
    "520381": "\u8D64\u6C34\u5E02",
    "520382": "\u4EC1\u6000\u5E02"
  },
  "520400": {
    "520401": "\u5E02\u8F96\u533A",
    "520402": "\u897F\u79C0\u533A",
    "520403": "\u5E73\u575D\u533A",
    "520422": "\u666E\u5B9A\u53BF",
    "520423": "\u9547\u5B81\u5E03\u4F9D\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "520424": "\u5173\u5CAD\u5E03\u4F9D\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "520425": "\u7D2B\u4E91\u82D7\u65CF\u5E03\u4F9D\u65CF\u81EA\u6CBB\u53BF"
  },
  "520500": {
    "520501": "\u5E02\u8F96\u533A",
    "520502": "\u4E03\u661F\u5173\u533A",
    "520521": "\u5927\u65B9\u53BF",
    "520522": "\u9ED4\u897F\u53BF",
    "520523": "\u91D1\u6C99\u53BF",
    "520524": "\u7EC7\u91D1\u53BF",
    "520525": "\u7EB3\u96CD\u53BF",
    "520526": "\u5A01\u5B81\u5F5D\u65CF\u56DE\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "520527": "\u8D6B\u7AE0\u53BF"
  },
  "520600": {
    "520601": "\u5E02\u8F96\u533A",
    "520602": "\u78A7\u6C5F\u533A",
    "520603": "\u4E07\u5C71\u533A",
    "520621": "\u6C5F\u53E3\u53BF",
    "520622": "\u7389\u5C4F\u4F97\u65CF\u81EA\u6CBB\u53BF",
    "520623": "\u77F3\u9621\u53BF",
    "520624": "\u601D\u5357\u53BF",
    "520625": "\u5370\u6C5F\u571F\u5BB6\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "520626": "\u5FB7\u6C5F\u53BF",
    "520627": "\u6CBF\u6CB3\u571F\u5BB6\u65CF\u81EA\u6CBB\u53BF",
    "520628": "\u677E\u6843\u82D7\u65CF\u81EA\u6CBB\u53BF"
  },
  "522300": {
    "522301": "\u5174\u4E49\u5E02",
    "522302": "\u5174\u4EC1\u5E02",
    "522323": "\u666E\u5B89\u53BF",
    "522324": "\u6674\u9686\u53BF",
    "522325": "\u8D1E\u4E30\u53BF",
    "522326": "\u671B\u8C1F\u53BF",
    "522327": "\u518C\u4EA8\u53BF",
    "522328": "\u5B89\u9F99\u53BF"
  },
  "522600": {
    "522601": "\u51EF\u91CC\u5E02",
    "522622": "\u9EC4\u5E73\u53BF",
    "522623": "\u65BD\u79C9\u53BF",
    "522624": "\u4E09\u7A57\u53BF",
    "522625": "\u9547\u8FDC\u53BF",
    "522626": "\u5C91\u5DE9\u53BF",
    "522627": "\u5929\u67F1\u53BF",
    "522628": "\u9526\u5C4F\u53BF",
    "522629": "\u5251\u6CB3\u53BF",
    "522630": "\u53F0\u6C5F\u53BF",
    "522631": "\u9ECE\u5E73\u53BF",
    "522632": "\u6995\u6C5F\u53BF",
    "522633": "\u4ECE\u6C5F\u53BF",
    "522634": "\u96F7\u5C71\u53BF",
    "522635": "\u9EBB\u6C5F\u53BF",
    "522636": "\u4E39\u5BE8\u53BF"
  },
  "522700": {
    "522701": "\u90FD\u5300\u5E02",
    "522702": "\u798F\u6CC9\u5E02",
    "522722": "\u8354\u6CE2\u53BF",
    "522723": "\u8D35\u5B9A\u53BF",
    "522725": "\u74EE\u5B89\u53BF",
    "522726": "\u72EC\u5C71\u53BF",
    "522727": "\u5E73\u5858\u53BF",
    "522728": "\u7F57\u7538\u53BF",
    "522729": "\u957F\u987A\u53BF",
    "522730": "\u9F99\u91CC\u53BF",
    "522731": "\u60E0\u6C34\u53BF",
    "522732": "\u4E09\u90FD\u6C34\u65CF\u81EA\u6CBB\u53BF"
  },
  "530000": {
    "530100": "\u6606\u660E\u5E02",
    "530300": "\u66F2\u9756\u5E02",
    "530400": "\u7389\u6EAA\u5E02",
    "530500": "\u4FDD\u5C71\u5E02",
    "530600": "\u662D\u901A\u5E02",
    "530700": "\u4E3D\u6C5F\u5E02",
    "530800": "\u666E\u6D31\u5E02",
    "530900": "\u4E34\u6CA7\u5E02",
    "532300": "\u695A\u96C4\u5F5D\u65CF\u81EA\u6CBB\u5DDE",
    "532500": "\u7EA2\u6CB3\u54C8\u5C3C\u65CF\u5F5D\u65CF\u81EA\u6CBB\u5DDE",
    "532600": "\u6587\u5C71\u58EE\u65CF\u82D7\u65CF\u81EA\u6CBB\u5DDE",
    "532800": "\u897F\u53CC\u7248\u7EB3\u50A3\u65CF\u81EA\u6CBB\u5DDE",
    "532900": "\u5927\u7406\u767D\u65CF\u81EA\u6CBB\u5DDE",
    "533100": "\u5FB7\u5B8F\u50A3\u65CF\u666F\u9887\u65CF\u81EA\u6CBB\u5DDE",
    "533300": "\u6012\u6C5F\u5088\u50F3\u65CF\u81EA\u6CBB\u5DDE",
    "533400": "\u8FEA\u5E86\u85CF\u65CF\u81EA\u6CBB\u5DDE"
  },
  "530100": {
    "530101": "\u5E02\u8F96\u533A",
    "530102": "\u4E94\u534E\u533A",
    "530103": "\u76D8\u9F99\u533A",
    "530111": "\u5B98\u6E21\u533A",
    "530112": "\u897F\u5C71\u533A",
    "530113": "\u4E1C\u5DDD\u533A",
    "530114": "\u5448\u8D21\u533A",
    "530115": "\u664B\u5B81\u533A",
    "530124": "\u5BCC\u6C11\u53BF",
    "530125": "\u5B9C\u826F\u53BF",
    "530126": "\u77F3\u6797\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "530127": "\u5D69\u660E\u53BF",
    "530128": "\u7984\u529D\u5F5D\u65CF\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "530129": "\u5BFB\u7538\u56DE\u65CF\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "530181": "\u5B89\u5B81\u5E02"
  },
  "530300": {
    "530301": "\u5E02\u8F96\u533A",
    "530302": "\u9E92\u9E9F\u533A",
    "530303": "\u6CBE\u76CA\u533A",
    "530304": "\u9A6C\u9F99\u533A",
    "530322": "\u9646\u826F\u53BF",
    "530323": "\u5E08\u5B97\u53BF",
    "530324": "\u7F57\u5E73\u53BF",
    "530325": "\u5BCC\u6E90\u53BF",
    "530326": "\u4F1A\u6CFD\u53BF",
    "530381": "\u5BA3\u5A01\u5E02"
  },
  "530400": {
    "530401": "\u5E02\u8F96\u533A",
    "530402": "\u7EA2\u5854\u533A",
    "530403": "\u6C5F\u5DDD\u533A",
    "530422": "\u6F84\u6C5F\u53BF",
    "530423": "\u901A\u6D77\u53BF",
    "530424": "\u534E\u5B81\u53BF",
    "530425": "\u6613\u95E8\u53BF",
    "530426": "\u5CE8\u5C71\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "530427": "\u65B0\u5E73\u5F5D\u65CF\u50A3\u65CF\u81EA\u6CBB\u53BF",
    "530428": "\u5143\u6C5F\u54C8\u5C3C\u65CF\u5F5D\u65CF\u50A3\u65CF\u81EA\u6CBB\u53BF"
  },
  "530500": {
    "530501": "\u5E02\u8F96\u533A",
    "530502": "\u9686\u9633\u533A",
    "530521": "\u65BD\u7538\u53BF",
    "530523": "\u9F99\u9675\u53BF",
    "530524": "\u660C\u5B81\u53BF",
    "530581": "\u817E\u51B2\u5E02"
  },
  "530600": {
    "530601": "\u5E02\u8F96\u533A",
    "530602": "\u662D\u9633\u533A",
    "530621": "\u9C81\u7538\u53BF",
    "530622": "\u5DE7\u5BB6\u53BF",
    "530623": "\u76D0\u6D25\u53BF",
    "530624": "\u5927\u5173\u53BF",
    "530625": "\u6C38\u5584\u53BF",
    "530626": "\u7EE5\u6C5F\u53BF",
    "530627": "\u9547\u96C4\u53BF",
    "530628": "\u5F5D\u826F\u53BF",
    "530629": "\u5A01\u4FE1\u53BF",
    "530681": "\u6C34\u5BCC\u5E02"
  },
  "530700": {
    "530701": "\u5E02\u8F96\u533A",
    "530702": "\u53E4\u57CE\u533A",
    "530721": "\u7389\u9F99\u7EB3\u897F\u65CF\u81EA\u6CBB\u53BF",
    "530722": "\u6C38\u80DC\u53BF",
    "530723": "\u534E\u576A\u53BF",
    "530724": "\u5B81\u8497\u5F5D\u65CF\u81EA\u6CBB\u53BF"
  },
  "530800": {
    "530801": "\u5E02\u8F96\u533A",
    "530802": "\u601D\u8305\u533A",
    "530821": "\u5B81\u6D31\u54C8\u5C3C\u65CF\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "530822": "\u58A8\u6C5F\u54C8\u5C3C\u65CF\u81EA\u6CBB\u53BF",
    "530823": "\u666F\u4E1C\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "530824": "\u666F\u8C37\u50A3\u65CF\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "530825": "\u9547\u6C85\u5F5D\u65CF\u54C8\u5C3C\u65CF\u62C9\u795C\u65CF\u81EA\u6CBB\u53BF",
    "530826": "\u6C5F\u57CE\u54C8\u5C3C\u65CF\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "530827": "\u5B5F\u8FDE\u50A3\u65CF\u62C9\u795C\u65CF\u4F64\u65CF\u81EA\u6CBB\u53BF",
    "530828": "\u6F9C\u6CA7\u62C9\u795C\u65CF\u81EA\u6CBB\u53BF",
    "530829": "\u897F\u76DF\u4F64\u65CF\u81EA\u6CBB\u53BF"
  },
  "530900": {
    "530901": "\u5E02\u8F96\u533A",
    "530902": "\u4E34\u7FD4\u533A",
    "530921": "\u51E4\u5E86\u53BF",
    "530922": "\u4E91\u53BF",
    "530923": "\u6C38\u5FB7\u53BF",
    "530924": "\u9547\u5EB7\u53BF",
    "530925": "\u53CC\u6C5F\u62C9\u795C\u65CF\u4F64\u65CF\u5E03\u6717\u65CF\u50A3\u65CF\u81EA\u6CBB\u53BF",
    "530926": "\u803F\u9A6C\u50A3\u65CF\u4F64\u65CF\u81EA\u6CBB\u53BF",
    "530927": "\u6CA7\u6E90\u4F64\u65CF\u81EA\u6CBB\u53BF"
  },
  "532300": {
    "532301": "\u695A\u96C4\u5E02",
    "532322": "\u53CC\u67CF\u53BF",
    "532323": "\u725F\u5B9A\u53BF",
    "532324": "\u5357\u534E\u53BF",
    "532325": "\u59DA\u5B89\u53BF",
    "532326": "\u5927\u59DA\u53BF",
    "532327": "\u6C38\u4EC1\u53BF",
    "532328": "\u5143\u8C0B\u53BF",
    "532329": "\u6B66\u5B9A\u53BF",
    "532331": "\u7984\u4E30\u53BF"
  },
  "532500": {
    "532501": "\u4E2A\u65E7\u5E02",
    "532502": "\u5F00\u8FDC\u5E02",
    "532503": "\u8499\u81EA\u5E02",
    "532504": "\u5F25\u52D2\u5E02",
    "532523": "\u5C4F\u8FB9\u82D7\u65CF\u81EA\u6CBB\u53BF",
    "532524": "\u5EFA\u6C34\u53BF",
    "532525": "\u77F3\u5C4F\u53BF",
    "532527": "\u6CF8\u897F\u53BF",
    "532528": "\u5143\u9633\u53BF",
    "532529": "\u7EA2\u6CB3\u53BF",
    "532530": "\u91D1\u5E73\u82D7\u65CF\u7476\u65CF\u50A3\u65CF\u81EA\u6CBB\u53BF",
    "532531": "\u7EFF\u6625\u53BF",
    "532532": "\u6CB3\u53E3\u7476\u65CF\u81EA\u6CBB\u53BF"
  },
  "532600": {
    "532601": "\u6587\u5C71\u5E02",
    "532622": "\u781A\u5C71\u53BF",
    "532623": "\u897F\u7574\u53BF",
    "532624": "\u9EBB\u6817\u5761\u53BF",
    "532625": "\u9A6C\u5173\u53BF",
    "532626": "\u4E18\u5317\u53BF",
    "532627": "\u5E7F\u5357\u53BF",
    "532628": "\u5BCC\u5B81\u53BF"
  },
  "532800": {
    "532801": "\u666F\u6D2A\u5E02",
    "532822": "\u52D0\u6D77\u53BF",
    "532823": "\u52D0\u814A\u53BF"
  },
  "532900": {
    "532901": "\u5927\u7406\u5E02",
    "532922": "\u6F3E\u6FDE\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "532923": "\u7965\u4E91\u53BF",
    "532924": "\u5BBE\u5DDD\u53BF",
    "532925": "\u5F25\u6E21\u53BF",
    "532926": "\u5357\u6DA7\u5F5D\u65CF\u81EA\u6CBB\u53BF",
    "532927": "\u5DCD\u5C71\u5F5D\u65CF\u56DE\u65CF\u81EA\u6CBB\u53BF",
    "532928": "\u6C38\u5E73\u53BF",
    "532929": "\u4E91\u9F99\u53BF",
    "532930": "\u6D31\u6E90\u53BF",
    "532931": "\u5251\u5DDD\u53BF",
    "532932": "\u9E64\u5E86\u53BF"
  },
  "533100": {
    "533102": "\u745E\u4E3D\u5E02",
    "533103": "\u8292\u5E02",
    "533122": "\u6881\u6CB3\u53BF",
    "533123": "\u76C8\u6C5F\u53BF",
    "533124": "\u9647\u5DDD\u53BF"
  },
  "533300": {
    "533301": "\u6CF8\u6C34\u5E02",
    "533323": "\u798F\u8D21\u53BF",
    "533324": "\u8D21\u5C71\u72EC\u9F99\u65CF\u6012\u65CF\u81EA\u6CBB\u53BF",
    "533325": "\u5170\u576A\u767D\u65CF\u666E\u7C73\u65CF\u81EA\u6CBB\u53BF"
  },
  "533400": {
    "533401": "\u9999\u683C\u91CC\u62C9\u5E02",
    "533422": "\u5FB7\u94A6\u53BF",
    "533423": "\u7EF4\u897F\u5088\u50F3\u65CF\u81EA\u6CBB\u53BF"
  },
  "540000": {
    "540100": "\u62C9\u8428\u5E02",
    "540200": "\u65E5\u5580\u5219\u5E02",
    "540300": "\u660C\u90FD\u5E02",
    "540400": "\u6797\u829D\u5E02",
    "540500": "\u5C71\u5357\u5E02",
    "540600": "\u90A3\u66F2\u5E02",
    "542500": "\u963F\u91CC\u5730\u533A"
  },
  "540100": {
    "540101": "\u5E02\u8F96\u533A",
    "540102": "\u57CE\u5173\u533A",
    "540103": "\u5806\u9F99\u5FB7\u5E86\u533A",
    "540104": "\u8FBE\u5B5C\u533A",
    "540121": "\u6797\u5468\u53BF",
    "540122": "\u5F53\u96C4\u53BF",
    "540123": "\u5C3C\u6728\u53BF",
    "540124": "\u66F2\u6C34\u53BF",
    "540127": "\u58A8\u7AF9\u5DE5\u5361\u53BF",
    "540171": "\u683C\u5C14\u6728\u85CF\u9752\u5DE5\u4E1A\u56ED\u533A",
    "540172": "\u62C9\u8428\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A",
    "540173": "\u897F\u85CF\u6587\u5316\u65C5\u6E38\u521B\u610F\u56ED\u533A",
    "540174": "\u8FBE\u5B5C\u5DE5\u4E1A\u56ED\u533A"
  },
  "540200": {
    "540202": "\u6851\u73E0\u5B5C\u533A",
    "540221": "\u5357\u6728\u6797\u53BF",
    "540222": "\u6C5F\u5B5C\u53BF",
    "540223": "\u5B9A\u65E5\u53BF",
    "540224": "\u8428\u8FE6\u53BF",
    "540225": "\u62C9\u5B5C\u53BF",
    "540226": "\u6602\u4EC1\u53BF",
    "540227": "\u8C22\u901A\u95E8\u53BF",
    "540228": "\u767D\u6717\u53BF",
    "540229": "\u4EC1\u5E03\u53BF",
    "540230": "\u5EB7\u9A6C\u53BF",
    "540231": "\u5B9A\u7ED3\u53BF",
    "540232": "\u4EF2\u5DF4\u53BF",
    "540233": "\u4E9A\u4E1C\u53BF",
    "540234": "\u5409\u9686\u53BF",
    "540235": "\u8042\u62C9\u6728\u53BF",
    "540236": "\u8428\u560E\u53BF",
    "540237": "\u5C97\u5DF4\u53BF"
  },
  "540300": {
    "540302": "\u5361\u82E5\u533A",
    "540321": "\u6C5F\u8FBE\u53BF",
    "540322": "\u8D21\u89C9\u53BF",
    "540323": "\u7C7B\u4E4C\u9F50\u53BF",
    "540324": "\u4E01\u9752\u53BF",
    "540325": "\u5BDF\u96C5\u53BF",
    "540326": "\u516B\u5BBF\u53BF",
    "540327": "\u5DE6\u8D21\u53BF",
    "540328": "\u8292\u5EB7\u53BF",
    "540329": "\u6D1B\u9686\u53BF",
    "540330": "\u8FB9\u575D\u53BF"
  },
  "540400": {
    "540402": "\u5DF4\u5B9C\u533A",
    "540421": "\u5DE5\u5E03\u6C5F\u8FBE\u53BF",
    "540422": "\u7C73\u6797\u53BF",
    "540423": "\u58A8\u8131\u53BF",
    "540424": "\u6CE2\u5BC6\u53BF",
    "540425": "\u5BDF\u9685\u53BF",
    "540426": "\u6717\u53BF"
  },
  "540500": {
    "540501": "\u5E02\u8F96\u533A",
    "540502": "\u4E43\u4E1C\u533A",
    "540521": "\u624E\u56CA\u53BF",
    "540522": "\u8D21\u560E\u53BF",
    "540523": "\u6851\u65E5\u53BF",
    "540524": "\u743C\u7ED3\u53BF",
    "540525": "\u66F2\u677E\u53BF",
    "540526": "\u63AA\u7F8E\u53BF",
    "540527": "\u6D1B\u624E\u53BF",
    "540528": "\u52A0\u67E5\u53BF",
    "540529": "\u9686\u5B50\u53BF",
    "540530": "\u9519\u90A3\u53BF",
    "540531": "\u6D6A\u5361\u5B50\u53BF"
  },
  "540600": {
    "540602": "\u8272\u5C3C\u533A",
    "540621": "\u5609\u9ECE\u53BF",
    "540622": "\u6BD4\u5982\u53BF",
    "540623": "\u8042\u8363\u53BF",
    "540624": "\u5B89\u591A\u53BF",
    "540625": "\u7533\u624E\u53BF",
    "540626": "\u7D22\u53BF",
    "540627": "\u73ED\u6208\u53BF",
    "540628": "\u5DF4\u9752\u53BF",
    "540629": "\u5C3C\u739B\u53BF",
    "540630": "\u53CC\u6E56\u53BF"
  },
  "542500": {
    "542521": "\u666E\u5170\u53BF",
    "542522": "\u672D\u8FBE\u53BF",
    "542523": "\u5676\u5C14\u53BF",
    "542524": "\u65E5\u571F\u53BF",
    "542525": "\u9769\u5409\u53BF",
    "542526": "\u6539\u5219\u53BF",
    "542527": "\u63AA\u52E4\u53BF"
  },
  "610000": {
    "610100": "\u897F\u5B89\u5E02",
    "610200": "\u94DC\u5DDD\u5E02",
    "610300": "\u5B9D\u9E21\u5E02",
    "610400": "\u54B8\u9633\u5E02",
    "610500": "\u6E2D\u5357\u5E02",
    "610600": "\u5EF6\u5B89\u5E02",
    "610700": "\u6C49\u4E2D\u5E02",
    "610800": "\u6986\u6797\u5E02",
    "610900": "\u5B89\u5EB7\u5E02",
    "611000": "\u5546\u6D1B\u5E02"
  },
  "610100": {
    "610101": "\u5E02\u8F96\u533A",
    "610102": "\u65B0\u57CE\u533A",
    "610103": "\u7891\u6797\u533A",
    "610104": "\u83B2\u6E56\u533A",
    "610111": "\u705E\u6865\u533A",
    "610112": "\u672A\u592E\u533A",
    "610113": "\u96C1\u5854\u533A",
    "610114": "\u960E\u826F\u533A",
    "610115": "\u4E34\u6F7C\u533A",
    "610116": "\u957F\u5B89\u533A",
    "610117": "\u9AD8\u9675\u533A",
    "610118": "\u9120\u9091\u533A",
    "610122": "\u84DD\u7530\u53BF",
    "610124": "\u5468\u81F3\u53BF"
  },
  "610200": {
    "610201": "\u5E02\u8F96\u533A",
    "610202": "\u738B\u76CA\u533A",
    "610203": "\u5370\u53F0\u533A",
    "610204": "\u8000\u5DDE\u533A",
    "610222": "\u5B9C\u541B\u53BF"
  },
  "610300": {
    "610301": "\u5E02\u8F96\u533A",
    "610302": "\u6E2D\u6EE8\u533A",
    "610303": "\u91D1\u53F0\u533A",
    "610304": "\u9648\u4ED3\u533A",
    "610322": "\u51E4\u7FD4\u53BF",
    "610323": "\u5C90\u5C71\u53BF",
    "610324": "\u6276\u98CE\u53BF",
    "610326": "\u7709\u53BF",
    "610327": "\u9647\u53BF",
    "610328": "\u5343\u9633\u53BF",
    "610329": "\u9E9F\u6E38\u53BF",
    "610330": "\u51E4\u53BF",
    "610331": "\u592A\u767D\u53BF"
  },
  "610400": {
    "610401": "\u5E02\u8F96\u533A",
    "610402": "\u79E6\u90FD\u533A",
    "610403": "\u6768\u9675\u533A",
    "610404": "\u6E2D\u57CE\u533A",
    "610422": "\u4E09\u539F\u53BF",
    "610423": "\u6CFE\u9633\u53BF",
    "610424": "\u4E7E\u53BF",
    "610425": "\u793C\u6CC9\u53BF",
    "610426": "\u6C38\u5BFF\u53BF",
    "610428": "\u957F\u6B66\u53BF",
    "610429": "\u65EC\u9091\u53BF",
    "610430": "\u6DF3\u5316\u53BF",
    "610431": "\u6B66\u529F\u53BF",
    "610481": "\u5174\u5E73\u5E02",
    "610482": "\u5F6C\u5DDE\u5E02"
  },
  "610500": {
    "610501": "\u5E02\u8F96\u533A",
    "610502": "\u4E34\u6E2D\u533A",
    "610503": "\u534E\u5DDE\u533A",
    "610522": "\u6F7C\u5173\u53BF",
    "610523": "\u5927\u8354\u53BF",
    "610524": "\u5408\u9633\u53BF",
    "610525": "\u6F84\u57CE\u53BF",
    "610526": "\u84B2\u57CE\u53BF",
    "610527": "\u767D\u6C34\u53BF",
    "610528": "\u5BCC\u5E73\u53BF",
    "610581": "\u97E9\u57CE\u5E02",
    "610582": "\u534E\u9634\u5E02"
  },
  "610600": {
    "610601": "\u5E02\u8F96\u533A",
    "610602": "\u5B9D\u5854\u533A",
    "610603": "\u5B89\u585E\u533A",
    "610621": "\u5EF6\u957F\u53BF",
    "610622": "\u5EF6\u5DDD\u53BF",
    "610625": "\u5FD7\u4E39\u53BF",
    "610626": "\u5434\u8D77\u53BF",
    "610627": "\u7518\u6CC9\u53BF",
    "610628": "\u5BCC\u53BF",
    "610629": "\u6D1B\u5DDD\u53BF",
    "610630": "\u5B9C\u5DDD\u53BF",
    "610631": "\u9EC4\u9F99\u53BF",
    "610632": "\u9EC4\u9675\u53BF",
    "610681": "\u5B50\u957F\u5E02"
  },
  "610700": {
    "610701": "\u5E02\u8F96\u533A",
    "610702": "\u6C49\u53F0\u533A",
    "610703": "\u5357\u90D1\u533A",
    "610722": "\u57CE\u56FA\u53BF",
    "610723": "\u6D0B\u53BF",
    "610724": "\u897F\u4E61\u53BF",
    "610725": "\u52C9\u53BF",
    "610726": "\u5B81\u5F3A\u53BF",
    "610727": "\u7565\u9633\u53BF",
    "610728": "\u9547\u5DF4\u53BF",
    "610729": "\u7559\u575D\u53BF",
    "610730": "\u4F5B\u576A\u53BF"
  },
  "610800": {
    "610801": "\u5E02\u8F96\u533A",
    "610802": "\u6986\u9633\u533A",
    "610803": "\u6A2A\u5C71\u533A",
    "610822": "\u5E9C\u8C37\u53BF",
    "610824": "\u9756\u8FB9\u53BF",
    "610825": "\u5B9A\u8FB9\u53BF",
    "610826": "\u7EE5\u5FB7\u53BF",
    "610827": "\u7C73\u8102\u53BF",
    "610828": "\u4F73\u53BF",
    "610829": "\u5434\u5821\u53BF",
    "610830": "\u6E05\u6DA7\u53BF",
    "610831": "\u5B50\u6D32\u53BF",
    "610881": "\u795E\u6728\u5E02"
  },
  "610900": {
    "610901": "\u5E02\u8F96\u533A",
    "610902": "\u6C49\u6EE8\u533A",
    "610921": "\u6C49\u9634\u53BF",
    "610922": "\u77F3\u6CC9\u53BF",
    "610923": "\u5B81\u9655\u53BF",
    "610924": "\u7D2B\u9633\u53BF",
    "610925": "\u5C9A\u768B\u53BF",
    "610926": "\u5E73\u5229\u53BF",
    "610927": "\u9547\u576A\u53BF",
    "610928": "\u65EC\u9633\u53BF",
    "610929": "\u767D\u6CB3\u53BF"
  },
  "611000": {
    "611001": "\u5E02\u8F96\u533A",
    "611002": "\u5546\u5DDE\u533A",
    "611021": "\u6D1B\u5357\u53BF",
    "611022": "\u4E39\u51E4\u53BF",
    "611023": "\u5546\u5357\u53BF",
    "611024": "\u5C71\u9633\u53BF",
    "611025": "\u9547\u5B89\u53BF",
    "611026": "\u67DE\u6C34\u53BF"
  },
  "620000": {
    "620100": "\u5170\u5DDE\u5E02",
    "620200": "\u5609\u5CEA\u5173\u5E02",
    "620300": "\u91D1\u660C\u5E02",
    "620400": "\u767D\u94F6\u5E02",
    "620500": "\u5929\u6C34\u5E02",
    "620600": "\u6B66\u5A01\u5E02",
    "620700": "\u5F20\u6396\u5E02",
    "620800": "\u5E73\u51C9\u5E02",
    "620900": "\u9152\u6CC9\u5E02",
    "621000": "\u5E86\u9633\u5E02",
    "621100": "\u5B9A\u897F\u5E02",
    "621200": "\u9647\u5357\u5E02",
    "622900": "\u4E34\u590F\u56DE\u65CF\u81EA\u6CBB\u5DDE",
    "623000": "\u7518\u5357\u85CF\u65CF\u81EA\u6CBB\u5DDE"
  },
  "620100": {
    "620101": "\u5E02\u8F96\u533A",
    "620102": "\u57CE\u5173\u533A",
    "620103": "\u4E03\u91CC\u6CB3\u533A",
    "620104": "\u897F\u56FA\u533A",
    "620105": "\u5B89\u5B81\u533A",
    "620111": "\u7EA2\u53E4\u533A",
    "620121": "\u6C38\u767B\u53BF",
    "620122": "\u768B\u5170\u53BF",
    "620123": "\u6986\u4E2D\u53BF",
    "620171": "\u5170\u5DDE\u65B0\u533A"
  },
  "620200": {
    "620201": "\u5E02\u8F96\u533A"
  },
  "620300": {
    "620301": "\u5E02\u8F96\u533A",
    "620302": "\u91D1\u5DDD\u533A",
    "620321": "\u6C38\u660C\u53BF"
  },
  "620400": {
    "620401": "\u5E02\u8F96\u533A",
    "620402": "\u767D\u94F6\u533A",
    "620403": "\u5E73\u5DDD\u533A",
    "620421": "\u9756\u8FDC\u53BF",
    "620422": "\u4F1A\u5B81\u53BF",
    "620423": "\u666F\u6CF0\u53BF"
  },
  "620500": {
    "620501": "\u5E02\u8F96\u533A",
    "620502": "\u79E6\u5DDE\u533A",
    "620503": "\u9EA6\u79EF\u533A",
    "620521": "\u6E05\u6C34\u53BF",
    "620522": "\u79E6\u5B89\u53BF",
    "620523": "\u7518\u8C37\u53BF",
    "620524": "\u6B66\u5C71\u53BF",
    "620525": "\u5F20\u5BB6\u5DDD\u56DE\u65CF\u81EA\u6CBB\u53BF"
  },
  "620600": {
    "620601": "\u5E02\u8F96\u533A",
    "620602": "\u51C9\u5DDE\u533A",
    "620621": "\u6C11\u52E4\u53BF",
    "620622": "\u53E4\u6D6A\u53BF",
    "620623": "\u5929\u795D\u85CF\u65CF\u81EA\u6CBB\u53BF"
  },
  "620700": {
    "620701": "\u5E02\u8F96\u533A",
    "620702": "\u7518\u5DDE\u533A",
    "620721": "\u8083\u5357\u88D5\u56FA\u65CF\u81EA\u6CBB\u53BF",
    "620722": "\u6C11\u4E50\u53BF",
    "620723": "\u4E34\u6CFD\u53BF",
    "620724": "\u9AD8\u53F0\u53BF",
    "620725": "\u5C71\u4E39\u53BF"
  },
  "620800": {
    "620801": "\u5E02\u8F96\u533A",
    "620802": "\u5D06\u5CD2\u533A",
    "620821": "\u6CFE\u5DDD\u53BF",
    "620822": "\u7075\u53F0\u53BF",
    "620823": "\u5D07\u4FE1\u53BF",
    "620825": "\u5E84\u6D6A\u53BF",
    "620826": "\u9759\u5B81\u53BF",
    "620881": "\u534E\u4EAD\u5E02"
  },
  "620900": {
    "620901": "\u5E02\u8F96\u533A",
    "620902": "\u8083\u5DDE\u533A",
    "620921": "\u91D1\u5854\u53BF",
    "620922": "\u74DC\u5DDE\u53BF",
    "620923": "\u8083\u5317\u8499\u53E4\u65CF\u81EA\u6CBB\u53BF",
    "620924": "\u963F\u514B\u585E\u54C8\u8428\u514B\u65CF\u81EA\u6CBB\u53BF",
    "620981": "\u7389\u95E8\u5E02",
    "620982": "\u6566\u714C\u5E02"
  },
  "621000": {
    "621001": "\u5E02\u8F96\u533A",
    "621002": "\u897F\u5CF0\u533A",
    "621021": "\u5E86\u57CE\u53BF",
    "621022": "\u73AF\u53BF",
    "621023": "\u534E\u6C60\u53BF",
    "621024": "\u5408\u6C34\u53BF",
    "621025": "\u6B63\u5B81\u53BF",
    "621026": "\u5B81\u53BF",
    "621027": "\u9547\u539F\u53BF"
  },
  "621100": {
    "621101": "\u5E02\u8F96\u533A",
    "621102": "\u5B89\u5B9A\u533A",
    "621121": "\u901A\u6E2D\u53BF",
    "621122": "\u9647\u897F\u53BF",
    "621123": "\u6E2D\u6E90\u53BF",
    "621124": "\u4E34\u6D2E\u53BF",
    "621125": "\u6F33\u53BF",
    "621126": "\u5CB7\u53BF"
  },
  "621200": {
    "621201": "\u5E02\u8F96\u533A",
    "621202": "\u6B66\u90FD\u533A",
    "621221": "\u6210\u53BF",
    "621222": "\u6587\u53BF",
    "621223": "\u5B95\u660C\u53BF",
    "621224": "\u5EB7\u53BF",
    "621225": "\u897F\u548C\u53BF",
    "621226": "\u793C\u53BF",
    "621227": "\u5FBD\u53BF",
    "621228": "\u4E24\u5F53\u53BF"
  },
  "622900": {
    "622901": "\u4E34\u590F\u5E02",
    "622921": "\u4E34\u590F\u53BF",
    "622922": "\u5EB7\u4E50\u53BF",
    "622923": "\u6C38\u9756\u53BF",
    "622924": "\u5E7F\u6CB3\u53BF",
    "622925": "\u548C\u653F\u53BF",
    "622926": "\u4E1C\u4E61\u65CF\u81EA\u6CBB\u53BF",
    "622927": "\u79EF\u77F3\u5C71\u4FDD\u5B89\u65CF\u4E1C\u4E61\u65CF\u6492\u62C9\u65CF\u81EA\u6CBB\u53BF"
  },
  "623000": {
    "623001": "\u5408\u4F5C\u5E02",
    "623021": "\u4E34\u6F6D\u53BF",
    "623022": "\u5353\u5C3C\u53BF",
    "623023": "\u821F\u66F2\u53BF",
    "623024": "\u8FED\u90E8\u53BF",
    "623025": "\u739B\u66F2\u53BF",
    "623026": "\u788C\u66F2\u53BF",
    "623027": "\u590F\u6CB3\u53BF"
  },
  "630000": {
    "630100": "\u897F\u5B81\u5E02",
    "630200": "\u6D77\u4E1C\u5E02",
    "632200": "\u6D77\u5317\u85CF\u65CF\u81EA\u6CBB\u5DDE",
    "632300": "\u9EC4\u5357\u85CF\u65CF\u81EA\u6CBB\u5DDE",
    "632500": "\u6D77\u5357\u85CF\u65CF\u81EA\u6CBB\u5DDE",
    "632600": "\u679C\u6D1B\u85CF\u65CF\u81EA\u6CBB\u5DDE",
    "632700": "\u7389\u6811\u85CF\u65CF\u81EA\u6CBB\u5DDE",
    "632800": "\u6D77\u897F\u8499\u53E4\u65CF\u85CF\u65CF\u81EA\u6CBB\u5DDE"
  },
  "630100": {
    "630101": "\u5E02\u8F96\u533A",
    "630102": "\u57CE\u4E1C\u533A",
    "630103": "\u57CE\u4E2D\u533A",
    "630104": "\u57CE\u897F\u533A",
    "630105": "\u57CE\u5317\u533A",
    "630121": "\u5927\u901A\u56DE\u65CF\u571F\u65CF\u81EA\u6CBB\u53BF",
    "630122": "\u6E5F\u4E2D\u53BF",
    "630123": "\u6E5F\u6E90\u53BF"
  },
  "630200": {
    "630202": "\u4E50\u90FD\u533A",
    "630203": "\u5E73\u5B89\u533A",
    "630222": "\u6C11\u548C\u56DE\u65CF\u571F\u65CF\u81EA\u6CBB\u53BF",
    "630223": "\u4E92\u52A9\u571F\u65CF\u81EA\u6CBB\u53BF",
    "630224": "\u5316\u9686\u56DE\u65CF\u81EA\u6CBB\u53BF",
    "630225": "\u5FAA\u5316\u6492\u62C9\u65CF\u81EA\u6CBB\u53BF"
  },
  "632200": {
    "632221": "\u95E8\u6E90\u56DE\u65CF\u81EA\u6CBB\u53BF",
    "632222": "\u7941\u8FDE\u53BF",
    "632223": "\u6D77\u664F\u53BF",
    "632224": "\u521A\u5BDF\u53BF"
  },
  "632300": {
    "632321": "\u540C\u4EC1\u53BF",
    "632322": "\u5C16\u624E\u53BF",
    "632323": "\u6CFD\u5E93\u53BF",
    "632324": "\u6CB3\u5357\u8499\u53E4\u65CF\u81EA\u6CBB\u53BF"
  },
  "632500": {
    "632521": "\u5171\u548C\u53BF",
    "632522": "\u540C\u5FB7\u53BF",
    "632523": "\u8D35\u5FB7\u53BF",
    "632524": "\u5174\u6D77\u53BF",
    "632525": "\u8D35\u5357\u53BF"
  },
  "632600": {
    "632621": "\u739B\u6C81\u53BF",
    "632622": "\u73ED\u739B\u53BF",
    "632623": "\u7518\u5FB7\u53BF",
    "632624": "\u8FBE\u65E5\u53BF",
    "632625": "\u4E45\u6CBB\u53BF",
    "632626": "\u739B\u591A\u53BF"
  },
  "632700": {
    "632701": "\u7389\u6811\u5E02",
    "632722": "\u6742\u591A\u53BF",
    "632723": "\u79F0\u591A\u53BF",
    "632724": "\u6CBB\u591A\u53BF",
    "632725": "\u56CA\u8C26\u53BF",
    "632726": "\u66F2\u9EBB\u83B1\u53BF"
  },
  "632800": {
    "632801": "\u683C\u5C14\u6728\u5E02",
    "632802": "\u5FB7\u4EE4\u54C8\u5E02",
    "632803": "\u832B\u5D16\u5E02",
    "632821": "\u4E4C\u5170\u53BF",
    "632822": "\u90FD\u5170\u53BF",
    "632823": "\u5929\u5CFB\u53BF",
    "632857": "\u5927\u67F4\u65E6\u884C\u653F\u59D4\u5458\u4F1A"
  },
  "640000": {
    "640100": "\u94F6\u5DDD\u5E02",
    "640200": "\u77F3\u5634\u5C71\u5E02",
    "640300": "\u5434\u5FE0\u5E02",
    "640400": "\u56FA\u539F\u5E02",
    "640500": "\u4E2D\u536B\u5E02"
  },
  "640100": {
    "640101": "\u5E02\u8F96\u533A",
    "640104": "\u5174\u5E86\u533A",
    "640105": "\u897F\u590F\u533A",
    "640106": "\u91D1\u51E4\u533A",
    "640121": "\u6C38\u5B81\u53BF",
    "640122": "\u8D3A\u5170\u53BF",
    "640181": "\u7075\u6B66\u5E02"
  },
  "640200": {
    "640201": "\u5E02\u8F96\u533A",
    "640202": "\u5927\u6B66\u53E3\u533A",
    "640205": "\u60E0\u519C\u533A",
    "640221": "\u5E73\u7F57\u53BF"
  },
  "640300": {
    "640301": "\u5E02\u8F96\u533A",
    "640302": "\u5229\u901A\u533A",
    "640303": "\u7EA2\u5BFA\u5821\u533A",
    "640323": "\u76D0\u6C60\u53BF",
    "640324": "\u540C\u5FC3\u53BF",
    "640381": "\u9752\u94DC\u5CE1\u5E02"
  },
  "640400": {
    "640401": "\u5E02\u8F96\u533A",
    "640402": "\u539F\u5DDE\u533A",
    "640422": "\u897F\u5409\u53BF",
    "640423": "\u9686\u5FB7\u53BF",
    "640424": "\u6CFE\u6E90\u53BF",
    "640425": "\u5F6D\u9633\u53BF"
  },
  "640500": {
    "640501": "\u5E02\u8F96\u533A",
    "640502": "\u6C99\u5761\u5934\u533A",
    "640521": "\u4E2D\u5B81\u53BF",
    "640522": "\u6D77\u539F\u53BF"
  },
  "650000": {
    "650100": "\u4E4C\u9C81\u6728\u9F50\u5E02",
    "650200": "\u514B\u62C9\u739B\u4F9D\u5E02",
    "650400": "\u5410\u9C81\u756A\u5E02",
    "650500": "\u54C8\u5BC6\u5E02",
    "652300": "\u660C\u5409\u56DE\u65CF\u81EA\u6CBB\u5DDE",
    "652700": "\u535A\u5C14\u5854\u62C9\u8499\u53E4\u81EA\u6CBB\u5DDE",
    "652800": "\u5DF4\u97F3\u90ED\u695E\u8499\u53E4\u81EA\u6CBB\u5DDE",
    "652900": "\u963F\u514B\u82CF\u5730\u533A",
    "653000": "\u514B\u5B5C\u52D2\u82CF\u67EF\u5C14\u514B\u5B5C\u81EA\u6CBB\u5DDE",
    "653100": "\u5580\u4EC0\u5730\u533A",
    "653200": "\u548C\u7530\u5730\u533A",
    "654000": "\u4F0A\u7281\u54C8\u8428\u514B\u81EA\u6CBB\u5DDE",
    "654200": "\u5854\u57CE\u5730\u533A",
    "654300": "\u963F\u52D2\u6CF0\u5730\u533A",
    "659000": "\u81EA\u6CBB\u533A\u76F4\u8F96\u53BF\u7EA7\u884C\u653F\u533A\u5212"
  },
  "650100": {
    "650101": "\u5E02\u8F96\u533A",
    "650102": "\u5929\u5C71\u533A",
    "650103": "\u6C99\u4F9D\u5DF4\u514B\u533A",
    "650104": "\u65B0\u5E02\u533A",
    "650105": "\u6C34\u78E8\u6C9F\u533A",
    "650106": "\u5934\u5C6F\u6CB3\u533A",
    "650107": "\u8FBE\u5742\u57CE\u533A",
    "650109": "\u7C73\u4E1C\u533A",
    "650121": "\u4E4C\u9C81\u6728\u9F50\u53BF"
  },
  "650200": {
    "650201": "\u5E02\u8F96\u533A",
    "650202": "\u72EC\u5C71\u5B50\u533A",
    "650203": "\u514B\u62C9\u739B\u4F9D\u533A",
    "650204": "\u767D\u78B1\u6EE9\u533A",
    "650205": "\u4E4C\u5C14\u79BE\u533A"
  },
  "650400": {
    "650402": "\u9AD8\u660C\u533A",
    "650421": "\u912F\u5584\u53BF",
    "650422": "\u6258\u514B\u900A\u53BF"
  },
  "650500": {
    "650502": "\u4F0A\u5DDE\u533A",
    "650521": "\u5DF4\u91CC\u5764\u54C8\u8428\u514B\u81EA\u6CBB\u53BF",
    "650522": "\u4F0A\u543E\u53BF"
  },
  "652300": {
    "652301": "\u660C\u5409\u5E02",
    "652302": "\u961C\u5EB7\u5E02",
    "652323": "\u547C\u56FE\u58C1\u53BF",
    "652324": "\u739B\u7EB3\u65AF\u53BF",
    "652325": "\u5947\u53F0\u53BF",
    "652327": "\u5409\u6728\u8428\u5C14\u53BF",
    "652328": "\u6728\u5792\u54C8\u8428\u514B\u81EA\u6CBB\u53BF"
  },
  "652700": {
    "652701": "\u535A\u4E50\u5E02",
    "652702": "\u963F\u62C9\u5C71\u53E3\u5E02",
    "652722": "\u7CBE\u6CB3\u53BF",
    "652723": "\u6E29\u6CC9\u53BF"
  },
  "652800": {
    "652801": "\u5E93\u5C14\u52D2\u5E02",
    "652822": "\u8F6E\u53F0\u53BF",
    "652823": "\u5C09\u7281\u53BF",
    "652824": "\u82E5\u7F8C\u53BF",
    "652825": "\u4E14\u672B\u53BF",
    "652826": "\u7109\u8006\u56DE\u65CF\u81EA\u6CBB\u53BF",
    "652827": "\u548C\u9759\u53BF",
    "652828": "\u548C\u7855\u53BF",
    "652829": "\u535A\u6E56\u53BF",
    "652871": "\u5E93\u5C14\u52D2\u7ECF\u6D4E\u6280\u672F\u5F00\u53D1\u533A"
  },
  "652900": {
    "652901": "\u963F\u514B\u82CF\u5E02",
    "652922": "\u6E29\u5BBF\u53BF",
    "652923": "\u5E93\u8F66\u53BF",
    "652924": "\u6C99\u96C5\u53BF",
    "652925": "\u65B0\u548C\u53BF",
    "652926": "\u62DC\u57CE\u53BF",
    "652927": "\u4E4C\u4EC0\u53BF",
    "652928": "\u963F\u74E6\u63D0\u53BF",
    "652929": "\u67EF\u576A\u53BF"
  },
  "653000": {
    "653001": "\u963F\u56FE\u4EC0\u5E02",
    "653022": "\u963F\u514B\u9676\u53BF",
    "653023": "\u963F\u5408\u5947\u53BF",
    "653024": "\u4E4C\u6070\u53BF"
  },
  "653100": {
    "653101": "\u5580\u4EC0\u5E02",
    "653121": "\u758F\u9644\u53BF",
    "653122": "\u758F\u52D2\u53BF",
    "653123": "\u82F1\u5409\u6C99\u53BF",
    "653124": "\u6CFD\u666E\u53BF",
    "653125": "\u838E\u8F66\u53BF",
    "653126": "\u53F6\u57CE\u53BF",
    "653127": "\u9EA6\u76D6\u63D0\u53BF",
    "653128": "\u5CB3\u666E\u6E56\u53BF",
    "653129": "\u4F3D\u5E08\u53BF",
    "653130": "\u5DF4\u695A\u53BF",
    "653131": "\u5854\u4EC0\u5E93\u5C14\u5E72\u5854\u5409\u514B\u81EA\u6CBB\u53BF"
  },
  "653200": {
    "653201": "\u548C\u7530\u5E02",
    "653221": "\u548C\u7530\u53BF",
    "653222": "\u58A8\u7389\u53BF",
    "653223": "\u76AE\u5C71\u53BF",
    "653224": "\u6D1B\u6D66\u53BF",
    "653225": "\u7B56\u52D2\u53BF",
    "653226": "\u4E8E\u7530\u53BF",
    "653227": "\u6C11\u4E30\u53BF"
  },
  "654000": {
    "654002": "\u4F0A\u5B81\u5E02",
    "654003": "\u594E\u5C6F\u5E02",
    "654004": "\u970D\u5C14\u679C\u65AF\u5E02",
    "654021": "\u4F0A\u5B81\u53BF",
    "654022": "\u5BDF\u5E03\u67E5\u5C14\u9521\u4F2F\u81EA\u6CBB\u53BF",
    "654023": "\u970D\u57CE\u53BF",
    "654024": "\u5DE9\u7559\u53BF",
    "654025": "\u65B0\u6E90\u53BF",
    "654026": "\u662D\u82CF\u53BF",
    "654027": "\u7279\u514B\u65AF\u53BF",
    "654028": "\u5C3C\u52D2\u514B\u53BF"
  },
  "654200": {
    "654201": "\u5854\u57CE\u5E02",
    "654202": "\u4E4C\u82CF\u5E02",
    "654221": "\u989D\u654F\u53BF",
    "654223": "\u6C99\u6E7E\u53BF",
    "654224": "\u6258\u91CC\u53BF",
    "654225": "\u88D5\u6C11\u53BF",
    "654226": "\u548C\u5E03\u514B\u8D5B\u5C14\u8499\u53E4\u81EA\u6CBB\u53BF"
  },
  "654300": {
    "654301": "\u963F\u52D2\u6CF0\u5E02",
    "654321": "\u5E03\u5C14\u6D25\u53BF",
    "654322": "\u5BCC\u8574\u53BF",
    "654323": "\u798F\u6D77\u53BF",
    "654324": "\u54C8\u5DF4\u6CB3\u53BF",
    "654325": "\u9752\u6CB3\u53BF",
    "654326": "\u5409\u6728\u4E43\u53BF"
  },
  "659000": {
    "659001": "\u77F3\u6CB3\u5B50\u5E02",
    "659002": "\u963F\u62C9\u5C14\u5E02",
    "659003": "\u56FE\u6728\u8212\u514B\u5E02",
    "659004": "\u4E94\u5BB6\u6E20\u5E02",
    "659006": "\u94C1\u95E8\u5173\u5E02"
  },
  "710000": {
    "710100": "\u53F0\u5317\u5E02",
    "710200": "\u9AD8\u96C4\u5E02",
    "710300": "\u57FA\u9686\u5E02",
    "710400": "\u53F0\u4E2D\u5E02",
    "710500": "\u53F0\u5357\u5E02",
    "710600": "\u65B0\u7AF9\u5E02",
    "710700": "\u5609\u4E49\u5E02"
  },
  "710100": {
    "710101": "\u5185\u6E56\u533A",
    "710102": "\u5357\u6E2F\u533A",
    "710103": "\u4E2D\u6B63\u533A",
    "710104": "\u677E\u5C71\u533A",
    "710105": "\u4FE1\u4E49\u533A",
    "710106": "\u5927\u5B89\u533A",
    "710107": "\u4E2D\u5C71\u533A",
    "710108": "\u6587\u5C71\u533A",
    "710109": "\u5927\u540C\u533A",
    "710110": "\u4E07\u534E\u533A",
    "710111": "\u58EB\u6797\u533A",
    "710112": "\u5317\u6295\u533A"
  },
  "710200": {
    "710201": "\u65B0\u5174\u533A",
    "710202": "\u524D\u91D1\u533A",
    "710203": "\u82A9\u96C5\u533A",
    "710204": "\u76D0\u57D5\u533A",
    "710205": "\u9F13\u5C71\u533A",
    "710206": "\u65D7\u6D25\u533A",
    "710207": "\u524D\u9547\u533A",
    "710208": "\u4E09\u6C11\u533A",
    "710209": "\u5DE6\u8425\u533A",
    "710210": "\u6960\u6893\u533A",
    "710211": "\u5C0F\u6E2F\u533A"
  },
  "710300": {
    "710301": "\u4EC1\u7231\u533A",
    "710302": "\u4FE1\u4E49\u533A",
    "710303": "\u4E2D\u6B63\u533A",
    "710304": "\u6696\u6696\u533A",
    "710305": "\u5B89\u4E50\u533A",
    "710307": "\u4E03\u5835\u533A"
  },
  "710400": {
    "710301": "\u4E2D\u533A",
    "710302": "\u4E1C\u533A",
    "710303": "\u5357\u533A",
    "710304": "\u897F\u533A",
    "710305": "\u5317\u533A",
    "710306": "\u5317\u5C6F\u533A",
    "710307": "\u897F\u5C6F\u533A",
    "710308": "\u5357\u5C6F\u533A"
  },
  "710500": {
    "710501": "\u4E2D\u897F\u533A",
    "710502": "\u4E1C\u533A",
    "710503": "\u5357\u533A",
    "710504": "\u5317\u533A",
    "710505": "\u5B89\u5E73\u533A",
    "710506": "\u5B89\u5357\u533A"
  },
  "710600": {
    "710601": "\u4E1C\u533A",
    "710602": "\u5317\u533A",
    "710603": "\u9999\u5C71\u533A"
  },
  "710700": {
    "710701": "\u4E1C\u533A",
    "710702": "\u897F\u533A"
  },
  "810000": {
    "810001": "\u4E2D\u897F\u5340",
    "810002": "\u7063\u4ED4\u5340",
    "810003": "\u6771\u5340",
    "810004": "\u5357\u5340",
    "810005": "\u6CB9\u5C16\u65FA\u5340",
    "810006": "\u6DF1\u6C34\u57D7\u5340",
    "810007": "\u4E5D\u9F8D\u57CE\u5340",
    "810008": "\u9EC3\u5927\u4ED9\u5340",
    "810009": "\u89C0\u5858\u5340",
    "810010": "\u8343\u7063\u5340",
    "810011": "\u5C6F\u9580\u5340",
    "810012": "\u5143\u6717\u5340",
    "810013": "\u5317\u5340",
    "810014": "\u5927\u57D4\u5340",
    "810015": "\u897F\u8CA2\u5340",
    "810016": "\u6C99\u7530\u5340",
    "810017": "\u8475\u9752\u5340",
    "810018": "\u96E2\u5CF6\u5340"
  },
  "820000": {
    "820001": "\u82B1\u5730\u746A\u5802\u5340",
    "820002": "\u82B1\u738B\u5802\u5340",
    "820003": "\u671B\u5FB7\u5802\u5340",
    "820004": "\u5927\u5802\u5340",
    "820005": "\u98A8\u9806\u5802\u5340",
    "820006": "\u5609\u6A21\u5802\u5340",
    "820007": "\u8DEF\u6C39\u586B\u6D77\u5340",
    "820008": "\u8056\u65B9\u6FDF\u5404\u5802\u5340"
  }
};
var chinaAreaData_default = chinaAreaData;

// src/components/biz/RegionPickerSheet.tsx
var import_jsx_runtime17 = __toESM(require_jsx_runtime(), 1);
var rootAreaMap = chinaAreaData_default;
var COUNTRY_CODE = "86";
var getEntries = (code) => Object.entries(rootAreaMap[code] ?? {});
var toPickerItems = (entries) => entries.map(([value, label]) => ({ value, label }));
var getInitialRegionPickerState = (region) => {
  const [provinceName, cityName, districtName] = region.trim().split(/\s+/).filter(Boolean);
  const provinceEntries = getEntries(COUNTRY_CODE);
  const provinceCode = provinceEntries.find(([, label]) => label === provinceName)?.[0] ?? provinceEntries[0]?.[0] ?? "";
  const cityEntries = getEntries(provinceCode);
  const cityCode = cityEntries.find(([, label]) => label === cityName)?.[0] ?? cityEntries[0]?.[0] ?? "";
  const districtEntries = getEntries(cityCode);
  const districtCode = districtEntries.find(([, label]) => label === districtName)?.[0] ?? districtEntries[0]?.[0] ?? "";
  return { provinceCode, cityCode, districtCode };
};
var buildRegionLabel = (provinceCode, cityCode, districtCode) => {
  const province = rootAreaMap[COUNTRY_CODE]?.[provinceCode] ?? "";
  const city = rootAreaMap[provinceCode]?.[cityCode] ?? "";
  const district = rootAreaMap[cityCode]?.[districtCode] ?? "";
  return [province, city, district].filter(Boolean).join(" ");
};
var RegionPickerSheet = ({
  isOpen,
  title = "\u9009\u62E9\u6240\u5728\u5730\u533A",
  value = "",
  onCancel,
  onConfirm
}) => {
  const [pickerState, setPickerState] = (0, import_react9.useState)(() => getInitialRegionPickerState(value));
  (0, import_react9.useEffect)(() => {
    if (!isOpen) {
      return;
    }
    setPickerState(getInitialRegionPickerState(value));
  }, [isOpen, value]);
  const provinceItems = (0, import_react9.useMemo)(() => toPickerItems(getEntries(COUNTRY_CODE)), []);
  const cityItems = (0, import_react9.useMemo)(
    () => toPickerItems(getEntries(pickerState.provinceCode)),
    [pickerState.provinceCode]
  );
  const districtItems = (0, import_react9.useMemo)(
    () => toPickerItems(getEntries(pickerState.cityCode)),
    [pickerState.cityCode]
  );
  if (!isOpen) {
    return null;
  }
  const handleProvinceChange = (nextValue) => {
    const provinceCode = String(nextValue);
    const nextCityCode = getEntries(provinceCode)[0]?.[0] ?? "";
    const nextDistrictCode = getEntries(nextCityCode)[0]?.[0] ?? "";
    setPickerState({ provinceCode, cityCode: nextCityCode, districtCode: nextDistrictCode });
  };
  const handleCityChange = (nextValue) => {
    const cityCode = String(nextValue);
    const nextDistrictCode = getEntries(cityCode)[0]?.[0] ?? "";
    setPickerState((prev) => ({ ...prev, cityCode, districtCode: nextDistrictCode }));
  };
  const handleDistrictChange = (nextValue) => {
    setPickerState((prev) => ({ ...prev, districtCode: String(nextValue) }));
  };
  const handleConfirm = () => {
    onConfirm(
      buildRegionLabel(pickerState.provinceCode, pickerState.cityCode, pickerState.districtCode)
    );
  };
  return /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "absolute inset-0 z-50 flex items-end", children: [
    /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
      "button",
      {
        type: "button",
        "aria-label": "\u5173\u95ED\u5730\u533A\u9009\u62E9",
        className: "absolute inset-0 bg-black/50",
        onClick: onCancel
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "relative z-10 w-full rounded-t-[24px] bg-white dark:bg-gray-900 pb-safe", children: [
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "flex items-center justify-between border-b border-border-light px-4 py-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("button", { type: "button", onClick: onCancel, className: "text-base text-text-sub active:opacity-70", children: "\u53D6\u6D88" }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)("div", { className: "text-lg font-semibold text-text-main", children: title }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(
          "button",
          {
            type: "button",
            onClick: handleConfirm,
            className: "text-base font-medium text-primary-start active:opacity-70",
            children: "\u786E\u5B9A"
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime17.jsxs)("div", { className: "grid grid-cols-3 gap-2 px-3 py-4", children: [
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(WheelPicker, { items: provinceItems, value: pickerState.provinceCode, onChange: handleProvinceChange }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(WheelPicker, { items: cityItems, value: pickerState.cityCode, onChange: handleCityChange }),
        /* @__PURE__ */ (0, import_jsx_runtime17.jsx)(WheelPicker, { items: districtItems, value: pickerState.districtCode, onChange: handleDistrictChange })
      ] })
    ] })
  ] });
};

// src/pages/ProductDetail/index.tsx
var import_jsx_runtime18 = __toESM(require_jsx_runtime(), 1);
var EMPTY_REVIEW_SUMMARY = {
  follow_up_count: 0,
  good_rate: 100,
  preview: [],
  total: 0,
  with_media_count: 0
};
var EMPTY_ADDRESS_FORM = {
  name: "",
  phone: "",
  region: "",
  detail: "",
  isDefault: true
};
var ProductDetailPage = () => {
  const params = useParams();
  const { goBack, goTo, navigate } = useAppNavigate();
  const { showToast } = useFeedback();
  const { isOffline, refreshStatus } = useNetworkStatus();
  const routeProductId = Number(params.id);
  const hasValidProductId = Number.isFinite(routeProductId) && routeProductId > 0;
  const [showSkuSheet, setShowSkuSheet] = (0, import_react10.useState)(false);
  const [showServiceSheet, setShowServiceSheet] = (0, import_react10.useState)(false);
  const [skuMode, setSkuMode] = (0, import_react10.useState)("select");
  const [quantity, setQuantity] = (0, import_react10.useState)(1);
  const [activeTab, setActiveTab] = (0, import_react10.useState)("details");
  const [isScrolled, setIsScrolled] = (0, import_react10.useState)(false);
  const [selectedOptions, setSelectedOptions] = (0, import_react10.useState)({});
  const [addresses, setAddresses] = (0, import_react10.useState)([]);
  const [selectedAddress, setSelectedAddress] = (0, import_react10.useState)(null);
  const [showAddressFormSheet, setShowAddressFormSheet] = (0, import_react10.useState)(false);
  const [showRegionPicker, setShowRegionPicker] = (0, import_react10.useState)(false);
  const [addressForm, setAddressForm] = (0, import_react10.useState)(EMPTY_ADDRESS_FORM);
  const [addressFormErrors, setAddressFormErrors] = (0, import_react10.useState)({});
  const [savingAddress, setSavingAddress] = (0, import_react10.useState)(false);
  const scrollRef = (0, import_react10.useRef)(null);
  const fallbackProductRequest = useRequest(
    (signal) => hasValidProductId ? Promise.resolve(null) : shopProductApi.latest({ limit: 1, page: 1 }, signal).then((response) => response.list[0] ?? null),
    {
      deps: [hasValidProductId],
      initialData: null
    }
  );
  const resolvedProductId = hasValidProductId ? routeProductId : fallbackProductRequest.data?.id ?? 0;
  (0, import_react10.useEffect)(() => {
    if (!hasValidProductId && fallbackProductRequest.data?.id) {
      navigate(buildShopProductPath(fallbackProductRequest.data.id), { replace: true });
    }
  }, [fallbackProductRequest.data, hasValidProductId, navigate]);
  const productRequest = useRequest(
    (signal) => resolvedProductId > 0 ? shopProductApi.detail(resolvedProductId, signal) : Promise.resolve(null),
    {
      cacheKey: `product:detail:${resolvedProductId}`,
      deps: [resolvedProductId],
      initialData: null,
      keepPreviousData: true
    }
  );
  const reviewSummaryRequest = useRequest(
    (signal) => resolvedProductId > 0 ? shopProductApi.reviewSummary(resolvedProductId, signal) : Promise.resolve(EMPTY_REVIEW_SUMMARY),
    {
      cacheKey: `product:reviews-summary:${resolvedProductId}`,
      deps: [resolvedProductId],
      initialData: EMPTY_REVIEW_SUMMARY,
      keepPreviousData: true
    }
  );
  const product = productRequest.data;
  const optionGroups = (0, import_react10.useMemo)(() => buildShopProductOptionGroups(product), [product]);
  const selectedSummary = buildShopProductSelectedSummary(optionGroups, selectedOptions, quantity);
  (0, import_react10.useEffect)(() => {
    setSelectedOptions((previous) => {
      const nextSelections = {};
      for (const group of optionGroups) {
        const previousValue = previous[group.name];
        nextSelections[group.name] = group.options.includes(previousValue) ? previousValue : group.options[0];
      }
      return nextSelections;
    });
  }, [optionGroups]);
  (0, import_react10.useEffect)(() => {
    const currentRef = scrollRef.current;
    if (!currentRef) {
      return void 0;
    }
    const handleScroll = () => {
      setIsScrolled(currentRef.scrollTop > 100);
    };
    currentRef.addEventListener("scroll", handleScroll);
    return () => currentRef.removeEventListener("scroll", handleScroll);
  }, []);
  const loadAddresses = (0, import_react10.useCallback)(async () => {
    const list = await addressApi.list().catch(() => []);
    setAddresses(list);
    setSelectedAddress((current) => {
      if (current) {
        const matched = list.find((item) => item.id === current.id);
        if (matched) {
          return matched;
        }
      }
      return list.find((item) => item.is_default) ?? list[0] ?? null;
    });
  }, []);
  (0, import_react10.useEffect)(() => {
    void loadAddresses();
  }, [loadAddresses]);
  const openSkuSheet = (mode) => {
    setSkuMode(mode);
    void loadAddresses();
    setShowSkuSheet(true);
  };
  const closeSkuSheet = () => {
    setShowSkuSheet(false);
  };
  const resetAddressForm = (0, import_react10.useCallback)(() => {
    setAddressForm(EMPTY_ADDRESS_FORM);
    setAddressFormErrors({});
    setSavingAddress(false);
  }, []);
  const handleCloseAddressForm = (0, import_react10.useCallback)(() => {
    setShowAddressFormSheet(false);
    setShowRegionPicker(false);
    resetAddressForm();
  }, [resetAddressForm]);
  const validateAddressForm = (0, import_react10.useCallback)(() => {
    const nextErrors = {};
    if (!addressForm.name.trim()) nextErrors.name = "\u6536\u8D27\u4EBA\u59D3\u540D\u4E0D\u80FD\u4E3A\u7A7A";
    if (!addressForm.phone.trim()) {
      nextErrors.phone = "\u624B\u673A\u53F7\u4E0D\u80FD\u4E3A\u7A7A";
    } else if (!/^1[3-9]\d{9}$/.test(addressForm.phone.trim())) {
      nextErrors.phone = "\u624B\u673A\u53F7\u683C\u5F0F\u4E0D\u6B63\u786E";
    }
    if (!addressForm.region.trim()) nextErrors.region = "\u6240\u5728\u5730\u533A\u4E0D\u80FD\u4E3A\u7A7A";
    if (!addressForm.detail.trim()) nextErrors.detail = "\u8BE6\u7EC6\u5730\u5740\u4E0D\u80FD\u4E3A\u7A7A";
    setAddressFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [addressForm]);
  const handleSubmitAddress = (0, import_react10.useCallback)(async () => {
    if (!validateAddressForm() || savingAddress) {
      return;
    }
    setSavingAddress(true);
    try {
      const id = await addressApi.add({
        name: addressForm.name.trim(),
        phone: addressForm.phone.trim(),
        region: addressForm.region.trim(),
        address: addressForm.detail.trim(),
        is_default: addressForm.isDefault
      });
      const list = await addressApi.list().catch(() => []);
      setAddresses(list);
      const nextSelected = list.find((item) => item.id === id) ?? list.find((item) => item.is_default) ?? list[0] ?? null;
      setSelectedAddress(nextSelected);
      showToast({ message: "\u5730\u5740\u5DF2\u6DFB\u52A0", type: "success" });
      setShowAddressFormSheet(false);
      setShowRegionPicker(false);
      resetAddressForm();
    } catch (err) {
      showToast({ message: getErrorMessage(err) || "\u4FDD\u5B58\u5730\u5740\u5931\u8D25", type: "error" });
      setSavingAddress(false);
    }
  }, [addressForm, resetAddressForm, savingAddress, showToast, validateAddressForm]);
  const handleManageAddress = (0, import_react10.useCallback)(() => {
    if (addresses.length === 0) {
      setShowAddressFormSheet(true);
      return;
    }
    goTo("address");
  }, [addresses.length, goTo]);
  const handleAddToCart = (0, import_react10.useCallback)(async () => {
    if (!product?.id) {
      showToast({ message: "\u5546\u54C1\u4FE1\u606F\u5F02\u5E38", type: "warning" });
      return;
    }
    const skuId = getSelectedSkuId(product, optionGroups, selectedOptions);
    if (optionGroups.length > 0 && (skuId == null || !Number.isFinite(skuId))) {
      showToast({ message: "\u8BF7\u5148\u9009\u62E9\u5B8C\u6574\u89C4\u683C", type: "warning" });
      return;
    }
    try {
      await shopCartApi.add(
        {
          product_id: product.id,
          quantity,
          ...skuId != null ? { sku_id: skuId } : {},
          source: "normal"
        },
        void 0
      );
      closeSkuSheet();
      showToast({ message: "\u5DF2\u52A0\u5165\u8D2D\u7269\u8F66", type: "success" });
    } catch (err) {
      showToast({ message: getErrorMessage(err) || "\u52A0\u5165\u8D2D\u7269\u8F66\u5931\u8D25", type: "error" });
    }
  }, [
    product,
    optionGroups,
    selectedOptions,
    quantity,
    showToast,
    closeSkuSheet
  ]);
  const handleBuyNow = (0, import_react10.useCallback)(async () => {
    if (!product?.id) {
      showToast({ message: "\u5546\u54C1\u4FE1\u606F\u5F02\u5E38", type: "warning" });
      return;
    }
    const skuId = getSelectedSkuId(product, optionGroups, selectedOptions);
    if (optionGroups.length > 0 && (skuId == null || !Number.isFinite(skuId))) {
      showToast({ message: "\u8BF7\u5148\u9009\u62E9\u5B8C\u6574\u89C4\u683C", type: "warning" });
      return;
    }
    if (!selectedAddress) {
      showToast({ message: "\u8BF7\u5148\u6DFB\u52A0\u6536\u8D27\u5730\u5740", type: "warning" });
      if (addresses.length === 0) {
        setShowAddressFormSheet(true);
      } else {
        goTo("address");
      }
      return;
    }
    try {
      closeSkuSheet();
      const result = await shopOrderApi.create({
        items: [{
          product_id: product.id,
          quantity,
          ...skuId != null ? { sku_id: skuId } : {}
        }],
        address_id: selectedAddress.id
      });
      const cashierParams = new URLSearchParams({
        order_id: String(result.order_id),
        amount: String(result.total_amount),
        total_score: String(result.total_score),
        order_no: result.order_no,
        pay_type: result.pay_type,
        balance: result.balance_available,
        score_balance: result.score
      });
      navigate(`/cashier?${cashierParams.toString()}`, { replace: true });
    } catch (err) {
      showToast({ message: getErrorMessage(err) || "\u521B\u5EFA\u8BA2\u5355\u5931\u8D25", type: "error" });
    }
  }, [product, optionGroups, selectedOptions, quantity, selectedAddress, addresses.length, showToast, goTo, closeSkuSheet, navigate]);
  const handleOpenSupport = (0, import_react10.useCallback)(() => {
    void openCustomerServiceLink(({ duration, message, type }) => {
      showToast({ duration, message, type });
    });
  }, [showToast]);
  const isLoading = productRequest.loading && !product || !hasValidProductId && fallbackProductRequest.loading;
  const hasBlockingError = !isLoading && !product && (Boolean(productRequest.error) || !hasValidProductId && Boolean(fallbackProductRequest.error));
  return /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { className: "relative flex flex-1 flex-col overflow-hidden bg-bg-base", children: [
    isOffline && /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      OfflineBanner,
      {
        onAction: refreshStatus,
        className: "absolute left-0 right-0 top-0 z-50"
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(ProductDetailHeader, { isScrolled, onBack: goBack, title: product?.name }),
    hasBlockingError ? /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
      ErrorState,
      {
        message: "\u5546\u54C1\u8BE6\u60C5\u52A0\u8F7D\u5931\u8D25",
        onRetry: () => {
          void Promise.allSettled([fallbackProductRequest.reload(), productRequest.reload()]);
        }
      }
    ) : /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)(import_jsx_runtime18.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime18.jsxs)("div", { ref: scrollRef, className: "flex-1 overflow-y-auto pb-[60px]", children: [
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          ProductOverviewSection,
          {
            loading: isLoading,
            onOpenServiceDescription: () => setShowServiceSheet(true),
            onOpenSku: openSkuSheet,
            product,
            quantity,
            selectedSummary
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          ProductReviewsSection,
          {
            loading: reviewSummaryRequest.loading && reviewSummaryRequest.data?.total === 0,
            moduleError: Boolean(reviewSummaryRequest.error),
            onRetry: () => void reviewSummaryRequest.reload().catch(() => void 0),
            onOpenReviews: () => goTo(buildShopProductReviewsPath(resolvedProductId)),
            onOpenQa: () => goTo(buildShopProductQaPath(resolvedProductId)),
            summary: reviewSummaryRequest.data
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
          ProductTabsSection,
          {
            activeTab,
            loading: isLoading,
            onChange: setActiveTab,
            product
          }
        )
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        ProductPurchaseBar,
        {
          onOpenStore: () => goTo("store"),
          onOpenHelp: handleOpenSupport,
          onOpenCart: () => goTo("cart"),
          onAddToCart: () => openSkuSheet("cart"),
          onBuyNow: () => openSkuSheet("buy")
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        ProductSkuSheet,
        {
          addresses,
          isOpen: showSkuSheet,
          mode: skuMode,
          onAddToCart: handleAddToCart,
          onClose: closeSkuSheet,
          onConfirm: handleBuyNow,
          onDecreaseQuantity: () => setQuantity((previous) => Math.max(1, previous - 1)),
          onIncreaseQuantity: () => setQuantity((previous) => previous + 1),
          onManageAddress: handleManageAddress,
          onSelectOption: (groupName, option) => setSelectedOptions((previous) => ({
            ...previous,
            [groupName]: option
          })),
          optionGroups,
          product,
          quantity,
          selectedAddress,
          setSelectedAddress,
          selectedOptions
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        ProductServiceSheet,
        {
          isOpen: showServiceSheet,
          onClose: () => setShowServiceSheet(false),
          product
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        ProductAddressFormSheet,
        {
          errors: addressFormErrors,
          isOpen: showAddressFormSheet,
          isSaving: savingAddress,
          onChange: (patch) => {
            setAddressForm((previous) => ({ ...previous, ...patch }));
            setAddressFormErrors((previous) => ({ ...previous, ...Object.keys(patch).reduce((acc, key) => {
              acc[key] = "";
              return acc;
            }, {}) }));
          },
          onClose: handleCloseAddressForm,
          onOpenRegionPicker: () => setShowRegionPicker(true),
          onSubmit: () => void handleSubmitAddress(),
          value: addressForm
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime18.jsx)(
        RegionPickerSheet,
        {
          isOpen: showRegionPicker,
          value: addressForm.region,
          onCancel: () => setShowRegionPicker(false),
          onConfirm: (region) => {
            setAddressForm((previous) => ({ ...previous, region }));
            setAddressFormErrors((previous) => ({ ...previous, region: "" }));
            setShowRegionPicker(false);
          }
        }
      )
    ] })
  ] });
};
export {
  ProductDetailPage
};
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.development.js:
  (**
   * @license React
   * react-dom.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.development.js:
  (**
   * @license React
   * react-jsx-runtime.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

@remix-run/router/dist/router.js:
  (**
   * @remix-run/router v1.23.2
   *
   * Copyright (c) Remix Software Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE.md file in the root directory of this source tree.
   *
   * @license MIT
   *)

react-router/dist/index.js:
  (**
   * React Router v6.30.3
   *
   * Copyright (c) Remix Software Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE.md file in the root directory of this source tree.
   *
   * @license MIT
   *)

react-router-dom/dist/index.js:
  (**
   * React Router DOM v6.30.3
   *
   * Copyright (c) Remix Software Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE.md file in the root directory of this source tree.
   *
   * @license MIT
   *)

lucide-react/dist/esm/shared/src/utils.js:
lucide-react/dist/esm/defaultAttributes.js:
lucide-react/dist/esm/Icon.js:
lucide-react/dist/esm/createLucideIcon.js:
lucide-react/dist/esm/icons/chevron-left.js:
lucide-react/dist/esm/icons/chevron-right.js:
lucide-react/dist/esm/icons/circle-alert.js:
lucide-react/dist/esm/icons/ellipsis.js:
lucide-react/dist/esm/icons/map-pin.js:
lucide-react/dist/esm/icons/message-circle.js:
lucide-react/dist/esm/icons/minus.js:
lucide-react/dist/esm/icons/package.js:
lucide-react/dist/esm/icons/plus.js:
lucide-react/dist/esm/icons/refresh-ccw.js:
lucide-react/dist/esm/icons/rotate-ccw.js:
lucide-react/dist/esm/icons/share.js:
lucide-react/dist/esm/icons/shield-check.js:
lucide-react/dist/esm/icons/shopping-cart.js:
lucide-react/dist/esm/icons/star.js:
lucide-react/dist/esm/icons/store.js:
lucide-react/dist/esm/icons/truck.js:
lucide-react/dist/esm/icons/wifi-off.js:
lucide-react/dist/esm/icons/x.js:
lucide-react/dist/esm/lucide-react.js:
  (**
   * @license lucide-react v0.546.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   *)
*/
