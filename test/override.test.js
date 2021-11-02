const { expect } = require("chai");
const sinon = require("sinon");

const { OverrideableBuilder } = require("../lib/build");

function getTestOI() {
    return {
        anotherFunc() {
            return 10;
        },
        someFunc() {
            return this.anotherFunc() + 1;
        },
        testFunc() {
            return this.someFunc() * 2;
        },
    };
}

describe("OverrideableBuilder", () => {
    it("should call original functions on result object with no overrides", () => {
        const oI = getTestOI();

        const spy = sinon.spy(oI);

        const builder = new OverrideableBuilder(oI);
        const withOverrides = builder.build();

        const result = withOverrides.testFunc();

        expect(spy.testFunc.callCount).to.equal(1);
        expect(spy.testFunc.alwaysCalledOn(result));

        expect(spy.someFunc.callCount).to.equal(1);
        expect(spy.someFunc.alwaysCalledOn(result));

        expect(spy.anotherFunc.callCount).to.equal(1);
        expect(spy.anotherFunc.alwaysCalledOn(result));

        expect(result).to.equal(22);
    });

    it("should call override functions on result object", () => {
        const oi = getTestOI();
        const oiSpy = sinon.spy(oi);

        const overrideSomeFunc = sinon.spy(function () {
            return 5 + this.anotherFunc();
        });

        const builder = new OverrideableBuilder(oi);
        builder.override((orig) => {
            return {
                ...orig,
                someFunc: overrideSomeFunc,
            };
        });
        const withOverrides = builder.build();

        const result = withOverrides.testFunc();

        expect(oiSpy.testFunc.callCount).to.equal(1);
        expect(oiSpy.testFunc.alwaysCalledOn(result));

        expect(oiSpy.someFunc.callCount).to.equal(0);

        expect(overrideSomeFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(oiSpy.anotherFunc.callCount).to.equal(1);
        expect(oiSpy.anotherFunc.alwaysCalledOn(result));

        expect(result).to.equal(30);
    });

    it("should call overrides provided later through 'this'", () => {
        const oi = getTestOI();
        const oiSpy = sinon.spy(oi);

        const overrideSomeFunc = sinon.spy(function () {
            return 5 + this.anotherFunc();
        });

        const overrideAnotherFunc = sinon.spy(function () {
            return 100;
        });

        const builder = new OverrideableBuilder(oi);
        builder.override((orig) => ({
            ...orig,
            someFunc: overrideSomeFunc,
        }));
        builder.override((orig) => ({
            ...orig,
            anotherFunc: overrideAnotherFunc,
        }));
        const withOverrides = builder.build();

        const result = withOverrides.testFunc();

        expect(oiSpy.testFunc.callCount).to.equal(1);
        expect(oiSpy.testFunc.alwaysCalledOn(result));

        expect(oiSpy.someFunc.callCount).to.equal(0);

        expect(overrideSomeFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(oiSpy.anotherFunc.callCount).to.equal(0);

        expect(overrideAnotherFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(result).to.equal(210);
    });

    it("should call overrides provided earlier through first param", () => {
        const oi = getTestOI();
        const oiSpy = sinon.spy(oi);

        let testFuncSpy;
        let testFuncSpy2;
        const overrideSomeFunc = sinon.spy(function () {
            return 5 + this.anotherFunc();
        });

        const overrideAnotherFunc = sinon.spy(function () {
            return 100;
        });

        const builder = new OverrideableBuilder(oi);
        builder.override((orig) => {
            testFuncSpy = sinon.spy(() => 3 * orig.testFunc());
            return {
                ...orig,
                testFunc: testFuncSpy,
                someFunc: overrideSomeFunc,
            };
        });
        builder.override((orig) => {
            testFuncSpy2 = sinon.spy(() => 7 * orig.testFunc());
            return {
                ...orig,
                testFunc: testFuncSpy2,
                anotherFunc: overrideAnotherFunc,
            };
        });
        const withOverrides = builder.build();

        const result = withOverrides.testFunc();

        expect(oiSpy.testFunc.callCount).to.equal(1);
        expect(oiSpy.testFunc.alwaysCalledOn(result));

        expect(oiSpy.someFunc.callCount).to.equal(0);

        expect(overrideSomeFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(oiSpy.anotherFunc.callCount).to.equal(0);

        expect(overrideAnotherFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(testFuncSpy.callCount).to.equal(1);
        expect(testFuncSpy.alwaysCalledOn(result));

        expect(testFuncSpy2.callCount).to.equal(1);
        expect(testFuncSpy2.alwaysCalledOn(result));

        // testFuncSpy is the "outer" layer of overrides
        expect(testFuncSpy2.calledBefore(testFuncSpy)).to.be.true;
        expect(testFuncSpy.calledBefore(oiSpy.testFunc)).to.be.true;

        expect(result).to.equal(4410);
    });

    it("should be able to add multiple layers of overrides by using multiple objects in callback", () => {
        const oi = getTestOI();
        const oiSpy = sinon.spy(oi);

        const overrideSomeFunc = sinon.spy(function () {
            return 5 + this.anotherFunc();
        });

        const overrideAnotherFunc = sinon.spy(function () {
            return 100;
        });

        const builder = new OverrideableBuilder(oi);
        builder.override((orig) => {
            const a = {
                ...orig,
                someFunc: overrideSomeFunc,
            };

            return {
                ...a,
                anotherFunc: overrideAnotherFunc,
            };
        });
        const withOverrides = builder.build();

        const result = withOverrides.testFunc();

        expect(oiSpy.testFunc.callCount).to.equal(1);
        expect(oiSpy.testFunc.alwaysCalledOn(result));

        expect(oiSpy.someFunc.callCount).to.equal(0);

        expect(overrideSomeFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(oiSpy.anotherFunc.callCount).to.equal(0);

        expect(overrideAnotherFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(result).to.equal(210);
    });

    it("should be able to add multiple layers of overrides by using addLayer in callback", () => {
        const oi = getTestOI();
        const oiSpy = sinon.spy(oi);

        const overrideSomeFunc = sinon.spy(function () {
            return 5 + this.anotherFunc();
        });

        const overrideAnotherFunc = sinon.spy(function () {
            return 100;
        });

        const builder = new OverrideableBuilder(oi);
        builder.override((oi, builder) => {
            builder
                .override((orig) => ({
                    ...orig,
                    someFunc: overrideSomeFunc,
                }))
                .override((orig) => ({
                    ...orig,
                    anotherFunc: overrideAnotherFunc,
                }));

            return oi;
        });
        const withOverrides = builder.build();

        const result = withOverrides.testFunc();

        expect(oiSpy.testFunc.callCount).to.equal(1);
        expect(oiSpy.testFunc.alwaysCalledOn(result));

        expect(oiSpy.someFunc.callCount).to.equal(0);

        expect(overrideSomeFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(oiSpy.anotherFunc.callCount).to.equal(0);

        expect(overrideAnotherFunc.callCount).to.equal(1);
        expect(overrideSomeFunc.alwaysCalledOn(result));

        expect(result).to.equal(210);
    });

    it("should work if overriding to undefined should work", () => {
        const oi = getTestOI();

        const builder = new OverrideableBuilder(oi);
        builder.override((oi) => {
            return {
                ...oi,
                someFunc: undefined,
            };
        });
        const withOverrides = builder.build();

        expect(withOverrides).to.have.property("someFunc").that.is.undefined;

        try {
            withOverrides.testFunc();
            expect.fail("Should not get here");
        } catch (ex) {
            expect(ex).to.be.instanceOf(TypeError);
            expect(ex.message).to.include("this.someFunc is not a function");
        }
    });

    it("should work if another layer overrides previous undefined", () => {
        const oi = getTestOI();

        const builder = new OverrideableBuilder(oi);
        builder.override((oi) => {
            return {
                ...oi,
                someFunc: undefined,
            };
        });
        builder.override((oi) => {
            return {
                ...oi,
                someFunc: () => 1,
            };
        });
        const withOverrides = builder.build();

        expect(withOverrides).to.have.property("someFunc").that.is.not.undefined;

        const result = withOverrides.testFunc();
        expect(result).to.equal(2);
    });

    it("override test from supertokens", async function () {
        // see https://github.com/supertokens/supertokens-node/issues/199 (issue 2 tests)
        let m = 0;
        const ep = {
            signIn: function () {
                this.getUserByEmail();
            },
            getUserByEmail: function () {
                m = 1;
            },
        };

        const tpep = {
            signIn: function () {
                ep.signIn.bind(derivedEp(this))();
            },
            getUsersByEmail: function () {
                ep.getUserByEmail.bind(derivedEp(this))();
            },
        };

        const derivedEp = (tpep) => {
            // cannot be overrided, but can be called on it's own
            return {
                signIn: function () {
                    tpep.signIn();
                },
                getUserByEmail: function () {
                    tpep.getUsersByEmail();
                },
            };
        };

        const builder = new OverrideableBuilder(tpep);
        builder.override((tpep) => ({
            ...tpep,
            signIn: function () {
                tpep.signIn();
            },
            getUsersByEmail: function () {
                m = 5;
                tpep.getUsersByEmail();
                if (m === 1) {
                    m = 2;
                }
            },
        }));
        const override = builder.build();

        override.signIn();

        expect(m).to.equal(2);

        m = 1;

        const derivedEpInstance = derivedEp(override); // created after user has created their override

        derivedEpInstance.getUserByEmail();

        expect(m).to.equal(2);
    });
});
