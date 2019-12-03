
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.ctx, $$.dirty);
            $$.dirty = [-1];
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/App.svelte generated by Svelte v3.16.0 */

    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[18] = list;
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (75:1) {#if gameStatus == 'WELCOME'}
    function create_if_block_3(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "New Game";
    			add_location(button, file, 75, 2, 1210);
    			dispose = listen_dev(button, "click", /*changeStatus*/ ctx[5]("GAME_INTIALISED"), false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(75:1) {#if gameStatus == 'WELCOME'}",
    		ctx
    	});

    	return block;
    }

    // (80:1) {#if gameStatus == 'GAME_INTIALISED'}
    function create_if_block_2(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let button;
    	let dispose;
    	let each_value_3 = /*players*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "NEW GAME";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			button = element("button");
    			button.textContent = "GO";
    			attr_dev(h1, "class", "svelte-aqx5r3");
    			add_location(h1, file, 80, 2, 1334);
    			add_location(button, file, 86, 2, 1448);
    			dispose = listen_dev(button, "click", /*changeStatus*/ ctx[5]("GAME_START"), false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*players*/ 2) {
    				each_value_3 = /*players*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t2.parentNode, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(80:1) {#if gameStatus == 'GAME_INTIALISED'}",
    		ctx
    	});

    	return block;
    }

    // (82:2) {#each players as player}
    function create_each_block_3(ctx) {
    	let div;
    	let input;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[11].call(input, /*player*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			add_location(input, file, 83, 4, 1393);
    			add_location(div, file, 82, 3, 1383);
    			dispose = listen_dev(input, "input", input_input_handler);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*player*/ ctx[12].name);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*players*/ 2 && input.value !== /*player*/ ctx[12].name) {
    				set_input_value(input, /*player*/ ctx[12].name);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(82:2) {#each players as player}",
    		ctx
    	});

    	return block;
    }

    // (89:1) {#if gameStatus == 'GAME_START'}
    function create_if_block_1(ctx) {
    	let t0;
    	let button;
    	let dispose;
    	let each_value_2 = /*players*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			button = element("button");
    			button.textContent = "ADD RESULT";
    			add_location(button, file, 95, 2, 1678);
    			dispose = listen_dev(button, "click", /*changeStatus*/ ctx[5]("GAME_ADD_RESULT"), false, false, false);
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*players*/ 2) {
    				each_value_2 = /*players*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t0.parentNode, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(89:1) {#if gameStatus == 'GAME_START'}",
    		ctx
    	});

    	return block;
    }

    // (90:2) {#each players as player}
    function create_each_block_2(ctx) {
    	let div;
    	let p0;
    	let t0_value = /*player*/ ctx[12].name + "";
    	let t0;
    	let t1;
    	let p1;
    	let t2_value = /*player*/ ctx[12].score + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			add_location(p0, file, 91, 4, 1609);
    			add_location(p1, file, 92, 4, 1634);
    			attr_dev(div, "class", "player-score svelte-aqx5r3");
    			add_location(div, file, 90, 3, 1578);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*players*/ 2 && t0_value !== (t0_value = /*player*/ ctx[12].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*players*/ 2 && t2_value !== (t2_value = /*player*/ ctx[12].score + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(90:2) {#each players as player}",
    		ctx
    	});

    	return block;
    }

    // (98:1) {#if gameStatus == 'GAME_ADD_RESULT'}
    function create_if_block(ctx) {
    	let h30;
    	let t1;
    	let div0;
    	let t2;
    	let h31;
    	let t4;
    	let div1;
    	let button0;
    	let t5;
    	let t6;
    	let button1;
    	let t7;
    	let t8;
    	let button2;
    	let t9;
    	let t10;
    	let button3;
    	let t11;
    	let t12;
    	let button4;
    	let t13;
    	let t14;
    	let h32;
    	let t16;
    	let div2;
    	let t17;
    	let button5;
    	let dispose;
    	let each_value_1 = /*players*/ ctx[1];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*players*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "Winner";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "Points";
    			t4 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t5 = text("1");
    			t6 = space();
    			button1 = element("button");
    			t7 = text("2");
    			t8 = space();
    			button2 = element("button");
    			t9 = text("3");
    			t10 = space();
    			button3 = element("button");
    			t11 = text("4");
    			t12 = space();
    			button4 = element("button");
    			t13 = text("5");
    			t14 = space();
    			h32 = element("h3");
    			h32.textContent = "Loser";
    			t16 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t17 = space();
    			button5 = element("button");
    			button5.textContent = "NEXT ROUND";
    			add_location(h30, file, 98, 2, 1797);
    			set_style(div0, "display", "grid");
    			set_style(div0, "grid-template-columns", "1fr 1fr 1fr 1fr");
    			add_location(div0, file, 99, 2, 1815);
    			add_location(h31, file, 104, 2, 2066);
    			set_style(button0, "background-color", /*points*/ ctx[3] === 1 ? "yellow" : "#f4f4f4");
    			add_location(button0, file, 106, 3, 2160);
    			set_style(button1, "background-color", /*points*/ ctx[3] === 2 ? "yellow" : "#f4f4f4");
    			add_location(button1, file, 107, 3, 2270);
    			set_style(button2, "background-color", /*points*/ ctx[3] === 3 ? "yellow" : "#f4f4f4");
    			add_location(button2, file, 108, 3, 2380);
    			set_style(button3, "background-color", /*points*/ ctx[3] === 4 ? "yellow" : "#f4f4f4");
    			add_location(button3, file, 109, 3, 2490);
    			set_style(button4, "background-color", /*points*/ ctx[3] === 5 ? "yellow" : "#f4f4f4");
    			add_location(button4, file, 110, 3, 2600);
    			set_style(div1, "display", "grid");
    			set_style(div1, "grid-template-columns", "1fr 1fr 1fr 1fr 1fr");
    			add_location(div1, file, 105, 2, 2084);
    			add_location(h32, file, 112, 2, 2718);
    			set_style(div2, "display", "grid");
    			set_style(div2, "grid-template-columns", "1fr 1fr 1fr 1fr");
    			add_location(div2, file, 113, 2, 2735);
    			add_location(button5, file, 124, 2, 3041);

    			dispose = [
    				listen_dev(button0, "click", /*setPoints*/ ctx[7](1), false, false, false),
    				listen_dev(button1, "click", /*setPoints*/ ctx[7](2), false, false, false),
    				listen_dev(button2, "click", /*setPoints*/ ctx[7](3), false, false, false),
    				listen_dev(button3, "click", /*setPoints*/ ctx[7](4), false, false, false),
    				listen_dev(button4, "click", /*setPoints*/ ctx[7](5), false, false, false),
    				listen_dev(button5, "click", /*computeResult*/ ctx[9], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(button0, t5);
    			append_dev(div1, t6);
    			append_dev(div1, button1);
    			append_dev(button1, t7);
    			append_dev(div1, t8);
    			append_dev(div1, button2);
    			append_dev(button2, t9);
    			append_dev(div1, t10);
    			append_dev(div1, button3);
    			append_dev(button3, t11);
    			append_dev(div1, t12);
    			append_dev(div1, button4);
    			append_dev(button4, t13);
    			insert_dev(target, t14, anchor);
    			insert_dev(target, h32, anchor);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, div2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			insert_dev(target, t17, anchor);
    			insert_dev(target, button5, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*winnerIndex, setWinner, players*/ 70) {
    				each_value_1 = /*players*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*points*/ 8) {
    				set_style(button0, "background-color", /*points*/ ctx[3] === 1 ? "yellow" : "#f4f4f4");
    			}

    			if (dirty & /*points*/ 8) {
    				set_style(button1, "background-color", /*points*/ ctx[3] === 2 ? "yellow" : "#f4f4f4");
    			}

    			if (dirty & /*points*/ 8) {
    				set_style(button2, "background-color", /*points*/ ctx[3] === 3 ? "yellow" : "#f4f4f4");
    			}

    			if (dirty & /*points*/ 8) {
    				set_style(button3, "background-color", /*points*/ ctx[3] === 4 ? "yellow" : "#f4f4f4");
    			}

    			if (dirty & /*points*/ 8) {
    				set_style(button4, "background-color", /*points*/ ctx[3] === 5 ? "yellow" : "#f4f4f4");
    			}

    			if (dirty & /*loserIndex, winnerIndex, setLoser, players*/ 278) {
    				each_value = /*players*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t14);
    			if (detaching) detach_dev(h32);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(button5);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(98:1) {#if gameStatus == 'GAME_ADD_RESULT'}",
    		ctx
    	});

    	return block;
    }

    // (101:3) {#each players as player, i}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*player*/ ctx[12].name + "";
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);

    			set_style(button, "background-color", /*winnerIndex*/ ctx[2] === /*i*/ ctx[14]
    			? "yellow"
    			: "#f4f4f4");

    			add_location(button, file, 101, 4, 1920);
    			dispose = listen_dev(button, "click", /*setWinner*/ ctx[6](/*i*/ ctx[14]), false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*players*/ 2 && t_value !== (t_value = /*player*/ ctx[12].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*winnerIndex*/ 4) {
    				set_style(button, "background-color", /*winnerIndex*/ ctx[2] === /*i*/ ctx[14]
    				? "yellow"
    				: "#f4f4f4");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(101:3) {#each players as player, i}",
    		ctx
    	});

    	return block;
    }

    // (115:3) {#each players as player, i}
    function create_each_block(ctx) {
    	let button;
    	let t0_value = /*player*/ ctx[12].name + "";
    	let t0;
    	let t1;
    	let button_disabled_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			set_style(button, "background-color", /*loserIndex*/ ctx[4] === /*i*/ ctx[14]
    			? "red"
    			: "#f4f4f4");

    			button.disabled = button_disabled_value = /*winnerIndex*/ ctx[2] === /*i*/ ctx[14];
    			add_location(button, file, 115, 4, 2840);
    			dispose = listen_dev(button, "click", /*setLoser*/ ctx[8](/*i*/ ctx[14]), false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*players*/ 2 && t0_value !== (t0_value = /*player*/ ctx[12].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*loserIndex*/ 16) {
    				set_style(button, "background-color", /*loserIndex*/ ctx[4] === /*i*/ ctx[14]
    				? "red"
    				: "#f4f4f4");
    			}

    			if (dirty & /*winnerIndex*/ 4 && button_disabled_value !== (button_disabled_value = /*winnerIndex*/ ctx[2] === /*i*/ ctx[14])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(115:3) {#each players as player, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let if_block0 = /*gameStatus*/ ctx[0] == "WELCOME" && create_if_block_3(ctx);
    	let if_block1 = /*gameStatus*/ ctx[0] == "GAME_INTIALISED" && create_if_block_2(ctx);
    	let if_block2 = /*gameStatus*/ ctx[0] == "GAME_START" && create_if_block_1(ctx);
    	let if_block3 = /*gameStatus*/ ctx[0] == "GAME_ADD_RESULT" && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(main, "class", "svelte-aqx5r3");
    			add_location(main, file, 73, 0, 1170);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			if (if_block1) if_block1.m(main, null);
    			append_dev(main, t1);
    			if (if_block2) if_block2.m(main, null);
    			append_dev(main, t2);
    			if (if_block3) if_block3.m(main, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*gameStatus*/ ctx[0] == "WELCOME") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*gameStatus*/ ctx[0] == "GAME_INTIALISED") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(main, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*gameStatus*/ ctx[0] == "GAME_START") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(main, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*gameStatus*/ ctx[0] == "GAME_ADD_RESULT") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					if_block3.m(main, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { name } = $$props;
    	let gameStatus = "WELCOME";

    	let players = [
    		{ name: "PLAYER1", score: 20000 },
    		{ name: "PLAYER2", score: 20000 },
    		{ name: "PLAYER3", score: 20000 },
    		{ name: "PLAYER4", score: 20000 }
    	];

    	const changeStatus = statusChange => () => {
    		$$invalidate(0, gameStatus = statusChange);
    	};

    	let winnerIndex = null;
    	let points = 0;
    	let loserIndex = null;

    	const setWinner = index => () => {
    		$$invalidate(2, winnerIndex = index);
    	};

    	const setPoints = pts => () => {
    		$$invalidate(3, points = pts);
    	};

    	const setLoser = index => () => {
    		$$invalidate(4, loserIndex = index);
    	};

    	const computeResult = () => {
    		let score = 100 * Math.pow(2, points - 1);

    		players.forEach((player, i) => {
    			if (i === winnerIndex) {
    				player.score += 3 * score;
    			} else {
    				player.score -= score;
    			}
    		});

    		if (loserIndex === null) {
    			players.forEach((player, i) => {
    				if (i === winnerIndex) {
    					player.score += 3 * score;
    				} else {
    					player.score -= score;
    				}
    			});
    		} else {
    			$$invalidate(1, players[winnerIndex].score += score, players);
    			$$invalidate(1, players[loserIndex].score -= score, players);
    		}

    		$$invalidate(2, winnerIndex = null);
    		$$invalidate(3, points = 0);
    		$$invalidate(4, loserIndex = null);
    		$$invalidate(0, gameStatus = "GAME_START");
    	};

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(player) {
    		player.name = this.value;
    		$$invalidate(1, players);
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(10, name = $$props.name);
    	};

    	$$self.$capture_state = () => {
    		return {
    			name,
    			gameStatus,
    			players,
    			winnerIndex,
    			points,
    			loserIndex
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(10, name = $$props.name);
    		if ("gameStatus" in $$props) $$invalidate(0, gameStatus = $$props.gameStatus);
    		if ("players" in $$props) $$invalidate(1, players = $$props.players);
    		if ("winnerIndex" in $$props) $$invalidate(2, winnerIndex = $$props.winnerIndex);
    		if ("points" in $$props) $$invalidate(3, points = $$props.points);
    		if ("loserIndex" in $$props) $$invalidate(4, loserIndex = $$props.loserIndex);
    	};

    	return [
    		gameStatus,
    		players,
    		winnerIndex,
    		points,
    		loserIndex,
    		changeStatus,
    		setWinner,
    		setPoints,
    		setLoser,
    		computeResult,
    		name,
    		input_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { name: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*name*/ ctx[10] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
