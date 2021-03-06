import React from 'react';
import update from 'immutability-helper';

import CartStep1 from './components/cart/cart-step-1';
import CartStep2 from './components/cart/cart-step-2';
import CartStep3 from './components/cart/cart-step-3';
import CartStepper from './components/cart/cart-stepper';

import Api from './api'

class Cart extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            active_step: 1,
            person: {
                "forename": "",
                "surname": "",
                "email": "",
                "phone": ""
            },
            billing_address: {
                billingAddress: {
                    "street": "",
                    "city": "",
                    "zip": "",
                    "country": ""
                },
                company: {
                    "name": "",
                    "dic": "",
                    "ico": "",
                    "icDph": ""
                }
            },
            delivery_address: {
                "street": "",
                "city": "",
                "zip": "",
                "country": ""
            },
            cart_items: [],
            delivery: "KURIER",
            payment: "CARD_ONLINE",
            shopping_company: false,
            different_del_address: false,
            validation_problems: [],
            deliveryOpts: {},
            paymentOpts: {}
        };

        this.deliveryOpts = [];
        this.paymentOpts = [];

        this.api = Api;
    }

    componentDidMount() {
        this.initCart();
    }

    static getEmptyCompany() {
        return {
            "name": "",
            "dic": "",
            "ico": "",
            "icDph": ""
        };
    }

    static getEmptyAddress() {
        return {
            "street": "",
            "city": "",
            "zip": "",
            "country": ""
        };
    }

    static getEmptyPerson() {
        return {
            "forename": "",
            "surname": "",
            "email": "",
            "phone": ""
        };
    }

    /**
     * @deprecated
     * @param onSuccess
     */
    mergeBillingAndDeliveryAddress(onSuccess) {
        if (!this.state.different_del_address) {
            this.setState((prevState) => {
                let delivery_address = {
                    "street": prevState.billing_address.billingAddress.street,
                    "city": prevState.billing_address.billingAddress.city,
                    "zip": prevState.billing_address.billingAddress.zip,
                    "country": prevState.billing_address.billingAddress.country
                };
                return update(prevState, {delivery_address: {$set: delivery_address}})
            }, () => {
                onSuccess();
            });
        } else {
            onSuccess();
        }
    }

    /**
     * Nacitanie obsahu kosika
     */
    loadCart() {
        this.api.get('/cart').then(response => {
            this.setState((prevState, props) => (
                update(prevState, {
                    cart_items: {$set: response.cartItems},
                    delivery: {$set: response.payment.deliveryType},
                    payment: {$set: response.payment.paymentMethod},
                    person: {$set: response.person ? response.person : Cart.getEmptyPerson()},
                    billing_address: {
                        $set: response.billingDetails ? response.billingDetails : {
                            billingAddress: Cart.getEmptyAddress(),
                            company: Cart.getEmptyCompany()
                        }
                    },
                    delivery_address: {$set: response.address ? response.address : Cart.getEmptyAddress()},
                    different_del_address: {$set: response.address ? true : false},
                    shopping_company: {$set: response.billingDetails && response.billingDetails.company.name !== "" ? true : false}
                })
            ));
        });
    }

    createDeliveryPaymentOptsFromResponse(response) {
        let object = {};
        response.map(item => {
            object[item.id] = item;
        });

        return object;
    }

    /**
     * Inicializacia kosik
     * @param onSuccess
     */
    initCart(onSuccess) {
        let promises = [];
        promises.push(this.api.get('/cart/delivery'));
        promises.push(this.api.get('/cart/payment'));
        promises.push(this.api.get('/cart'));
        Promise.all(promises).then(responses => {
            this.deliveryOpts = responses[0];
            this.paymentOpts = responses[1];
            this.setState((prevState, props) => (
                update(prevState, {
                    cart_items: {$set: responses[2].cartItems},
                    delivery: {$set: responses[2].payment.deliveryType},
                    payment: {$set: responses[2].payment.paymentMethod},
                    person: {$set: responses[2].person ? responses[2].person : Cart.getEmptyPerson()},
                    billing_address: {
                        $set: responses[2].billingDetails ? responses[2].billingDetails : {
                            billingAddress: Cart.getEmptyAddress(),
                            company: Cart.getEmptyCompany()
                        }
                    },
                    delivery_address: {$set: responses[2].address ? responses[2].address : Cart.getEmptyAddress()},
                    different_del_address: {$set: responses[2].address ? true : false},
                    shopping_company: {$set: responses[2].billingDetails && responses[2].billingDetails.company.name !== "" ? true : false},
                    paymentOpts: {$set: this.createDeliveryPaymentOptsFromResponse(responses[1])},
                    deliveryOpts: {$set: this.createDeliveryPaymentOptsFromResponse(responses[0])}
                }, () => {
                    onSuccess();
                })
            ));
        });
    }

    /**
     * Validacia inputov
     * @param onValid
     */
    validateInputs(onValid) {
        let problems = [];

        if (this.state.person.forename == "") {
            problems.push("name");
        }

        if (this.state.person.surname == "") {
            problems.push("surname");
        }

        if (this.state.person.email == "") {
            problems.push("email");
        }

        if (this.state.person.phone == "") {
            problems.push("phone");
        }

        if (this.state.billing_address.billingAddress.street == "") {
            problems.push("billing-address");
        }

        if (this.state.billing_address.billingAddress.city == "") {
            problems.push("billing-city");
        }

        if (this.state.billing_address.billingAddress.zip == "") {
            problems.push("billing-zip");
        }

        if (this.state.billing_address.billingAddress.country == "") {
            problems.push("billing-country");
        }

        if (this.state.shopping_company) {
            if (this.state.billing_address.company.name == "") {
                problems.push("company-name");
            }

            if (this.state.billing_address.company.dic == "") {
                problems.push("dic");
            }

            if (this.state.billing_address.company.ico == "") {
                problems.push("ico");
            }

            if (this.state.billing_address.company.icDph == "") {
                problems.push("ic-dph");
            }
        }

        if (this.state.different_del_address) {
            if (this.state.delivery_address.street == "") {
                problems.push("delivery-address");
            }

            if (this.state.delivery_address.city == "") {
                problems.push("delivery-city");
            }

            if (this.state.delivery_address.zip == "") {
                problems.push("delivery-zip");
            }

            if (this.state.delivery_address.country == "") {
                problems.push("delivery-country");
            }
        }

        this.setState((prevState) => (
            update(prevState, {validation_problems: {$set: problems}})
        ), () => {
            if (problems.length == 0) {
                onValid();
            }
        })
    }

    /**
     * Vysledne ceny v kosiku
     * @returns {{items_price: number, delivery_price: *, payment_price: *, total_price: *}}
     */
    getTotalPrice() {
        let itemsPrice = 0;
        let deliveryPrice = this.getActiveDelivery() ? this.getActiveDelivery().price : 0;
        let paymentPrice = this.getActivePayment() ? this.getActivePayment().price : 0;


        this.state.cart_items.map((item) => {
            itemsPrice += item.price * item.quantity;
        });

        return {
            items_price: itemsPrice,
            delivery_price: deliveryPrice,
            payment_price: paymentPrice,
            total_price: itemsPrice + deliveryPrice + paymentPrice
        };
    }

    /**
     * Reálna zmena kroku kosika
     * @param step_id
     */
    changeStep(step_id) {
        this.setState((prevState, props) => (
            update(prevState, {active_step: {$set: step_id}})
        ))
    }

    /**
     * Akcia po zmene inputu nad person, adresou, billing details, delivery adres
     * @param change
     * @param id
     */
    onChangeInput(change, id) {
        this.setState((prevState, props) => {
            if (prevState.validation_problems.indexOf(id) !== -1) {
                change['validation_problems'] = {$splice: [[prevState.validation_problems.indexOf(id), 1]]};
            }
            return update(prevState, change)
        });
    }

    /**
     * Akcia pri zmazani itemu v kosiku
     * @param id
     */
    onCartItemDelete(id) {
        this.context.removeFromCart(id, () => {
            this.loadCart();
        });

    }

    /**
     * Akcia na zmenu sposobu dodania
     * @param delivery_id
     */
    onChangeDelivery(delivery_id) {
        this.setState((prevState, props) => (
            update(prevState, {delivery: {$set: delivery_id}})
        ))
    }

    /**
     * Akcia na zmenu metody platby
     * @param payment_id
     */
    onChangePayment(payment_id) {
        this.setState((prevState, props) => (
            update(prevState, {payment: {$set: payment_id}})
        ))
    }

    /**
     * Akcia pri pokuse o zmenu kroku kosika
     * @param step_id
     * @returns {string}
     */
    onChangeStep(step_id) {
        switch (step_id) {
            case 0:
                return window.location = "/";
            case 2:
                this.api.put('/cart', {
                    deliveryType: this.state.delivery,
                    paymentMethod: this.state.payment
                }).then(response => {
                    this.changeStep(step_id);
                });
                break;
            case 3:
                if (this.state.active_step == 2) {
                    this.validateInputs(()=> {
                        this.api.put('/cart', {
                            person: {
                                "forename": this.state.person.forename,
                                "surname": this.state.person.surname,
                                "email": this.state.person.email,
                                "phone": this.state.person.phone
                            },
                            billingAddress: this.state.billing_address,
                            address: this.state.different_del_address ? this.state.delivery_address : null
                        }).then(response => {
                            this.changeStep(step_id);
                        });
                    })
                }
                break;
            case 4:
                alert("Ďakujeme za nákup");
                window.setTimeout(function () {
                    window.location = '/';
                }, 3000);
                break;
            default:
                this.changeStep(step_id);
        }
    }

    /**
     * Akcia pri zmene prepinaca: Nakupujes na firmu?
     * @param value
     */
    onChangeShoopingCompany(value) {
        this.setState((prevState, props) => (
            update(prevState, {
                shopping_company: {$set: value},
                billing_address: {company: {$set: Cart.getEmptyCompany()}}
            })
        ));
    }

    /**
     * Akcia pri zmene prepinaca: Dodacia adresa ina ako fakturacna?
     * @param value
     */
    onChangeDifferentDelAddress(value) {
        this.setState((prevState, props) => (
            update(prevState, {different_del_address: {$set: value}})
        ));
    }

    /**
     * @returns {Array|*|R}
     */
    getDeliveryOpts() {
        return this.deliveryOpts;
    }

    /**
     * @returns {R|*|Array}
     */
    getPaymentOpts() {
        return this.paymentOpts;
    }

    /**
     * PREROBIT NA OBJEKT
     * Vrati objekt aktivnej platby
     * @returns {*}
     */
    getActivePayment() {
        let payment = null;
        if (this.state.payment in this.state.paymentOpts) {
            payment = this.state.paymentOpts[this.state.payment];
        }

        if (!payment) {
            return this.state.paymentOpts[Object.keys(this.state.paymentOpts)[0]];
        }
        return payment;
    }

    /**
     * Vrati objekt aktivneho sposobu dodania
     * @returns {*}
     */
    getActiveDelivery() {
        let delivery = null;

        if (this.state.delivery in this.state.deliveryOpts) {
            delivery = this.state.deliveryOpts[this.state.delivery];
        }

        if (!delivery) {
            delivery = this.state.deliveryOpts[Object.keys(this.state.deliveryOpts)[0]];
        }

        return delivery;
    }

    /**
     * Vrati sablonu kosika
     * @returns {*}
     */
    getStep() {
        let stepData = null;


        if (this.state.cart_items.length == 0) {
            return (
                <div id="no-items">Váš košík neobsahuje žiadne produkty. <br/> <a href="/">Hor sa
                    nakupovať</a></div>
            )
        }

        let cart_prices = this.getTotalPrice();

        let payment = this.getActivePayment();

        let delivery = this.getActiveDelivery();

        switch (this.state.active_step) {
            case 1:
                stepData = (
                    <CartStep1 products={this.state.cart_items}
                               paymentOpts={this.state.paymentOpts}
                               deliveryOpts={this.state.deliveryOpts}

                               payment={payment}
                               delivery={delivery}
                               productTotalPrice={cart_prices.items_price}
                               totalPrice={cart_prices.total_price}

                               onChangeStep={(step) => this.onChangeStep(step)}
                               onCartItemDelete={(id) => this.onCartItemDelete(id)}
                               onChangeDelivery={(id) => this.onChangeDelivery(id)}
                               onChangePayment={(id) => this.onChangePayment(id)}
                    />
                );
                break;
            case
            2
            :
                stepData = (
                    <CartStep2 person={this.state.person}
                               billing_address={this.state.billing_address}
                               delivery_address={this.state.delivery_address}
                               shoppingCompany={this.state.shopping_company}
                               differentDelAddress={this.state.different_del_address}
                               onChangeShoppingCompany={(state) => this.onChangeShoopingCompany(state)}
                               onChangeDifferentDelAddress={(state) => this.onChangeDifferentDelAddress(state)}
                               onChangeInput={(change, id) => this.onChangeInput(change, id)}
                               onChangeStep={(step) => this.onChangeStep(step)}
                               validationProblems={this.state.validation_problems}
                    />
                );
                break;
            case
            3
            :
                stepData = (
                    <CartStep3 products={this.state.cart_items}
                               person={this.state.person}
                               billing_address={this.state.billing_address}
                               delivery_address={this.state.delivery_address}
                               payment={payment}
                               delivery={delivery}
                               onChangeStep={(step) => this.onChangeStep(step)}
                               differentDelAddress={this.state.different_del_address}
                    />
                );
                break;
        }

        return stepData;
    }

    /**
     * Vrati steper
     * @returns {*}
     */
    getSteper() {
        let stepper = null;
        if (this.state.cart_items.length > 0) {
            stepper = <CartStepper active={this.state.active_step}/>
        }
        return stepper;
    }

    render() {
        return (
            <div id="main-container">
                <div className="container">
                    {this.getSteper()}
                    {this.getStep()}
                </div>
            </div>
        );
    }
}

Cart.contextTypes = {
    removeFromCart: React.PropTypes.func
};


export default Cart;