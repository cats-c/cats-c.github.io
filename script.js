const file = './assets/cats';
const error = './assets/error.jpg';
const [pad, margin] = [1000, 1000];
const [min, max] = [1, 5];
const initial = 2;

window.onload = () => {
    const controls = document.querySelector('#controls');
    const content = (e => (e.down = 0, e))(document.querySelector('#content'));
    ['heart', 'scroll', 'minus', 'plus'].forEach(s => controls[s] = controls.querySelector('.' + s));

    const col = (e => () => (e => (e.up = 0, e))(e.cloneNode()))(document.querySelector('.col'));
    const move = (c, v) => (c.up += v, c.style.transform = `translateY(${content.down - c.up}px)`);
    const child = (col, d) => d < 0 ? col.firstElementChild : col.lastElementChild;
    const height = (col, d) => child(col, d)?.clientHeight;
    const space = (col, d) => height(col, d) + pad + margin;

    const set = () => {
        let e = document.elementFromPoint(0, 50);
        if (e.tagName.toLowerCase() !== 'img') e = null;
        let i = items.findIndex(i => i.src === e.src);
        let [l, u] = ((i < 0) && (i = 0), [i, i - 1]);
        const b = i => (i => i < 0 ? i + items.length : i)(i % items.length);
        const m = (d, n) => d < 0 ? l = b(l + n) : u = b(u - n);

        const pop = (d, e) => {
            let [o] = [d < 0 ? l : u, m(d, 1)];
            let i = items.findIndex(v => v.src === e.src);
            if (i !== o) (items[i] = items[o], items[o] = e);
        }

        const push = (d, cb, r) => {
            let down = d < 0 && l > 0;
            let up = d >= 0 && u < items.length - 1;
            const load = e => e.complete ? cb(e) : e.onload = () => cb(e);
            const copy = e => e.parentElement ? load(e.cloneNode()) : cb(e);
            const add = (l, i) => (e => (e.src = l[i], l[i] = e, e))(document.createElement('img'));
            const get = (l, i) => typeof l[i] === 'string' ? load(add(l, i)) : copy(l[i]);
            if (r || down || up) (m(d, -1), get(items, d < 0 ? l : u));
            else request(() => push(d, cb, true));
        }

        const request = cb => {
            if (items.length) return cb();
            const err = () => (items.push(error), cb());
            fetch(`${file}.json`).then(res => {
                res.json().then(res => {
                    items = res.map(s => `${file}/${s}`);
                    if (!items.length) return err();
                    let offset = Math.floor(Math.random() * items.length);
                    items.push(...items.splice(0, offset));
                    cb();
                }, err);
            }, err);
        }

        const fill = (cols, cb, r) => {
            if (removed()) return cb();

            const shift = (col, d, e) => {
                let [up, down] = [col.up, content.down];
                let scroll = (shuffle ? col : content).scrollTop;
                let shift = d < 0 ? height(col, -1) || 0 : 0;
                if (d < 0) child(col, -1).remove();
                else col.prepend(e);
                shifting = true;
                col.up = height(col, -1);
                if (shuffle) up = col.up;
                let diff = up - (d < 0 ? col.up + shift : 0);
                if (shuffle) return col.scrollTop = scroll + diff;
                content.down = Math.max(...cols.map(c => c.up));
                content.scrollTop = scroll + content.down - down + diff;
                cols.forEach(c => move(c, c === col ? 0 : -diff));
            }

            const add = (col, d) => push(d, e => {
                requestAnimationFrame(() => {
                    if (removed()) return;
                    d < 0 ? shift(col, 1, e) : col.append(e);
                    fill(cols, cb, [col, d]);
                })
            })

            const remove = (col, d) => {
                let remove = child(col, d);
                if (r && col === r[0] && d === r[1]) return false;
                col[d < 0 ? 'top' : 'bot'] -= remove.clientHeight;
                d < 0 ? shift(col, -1) : child(col, 1).remove();
                pop(d, remove);
                return true;
            }

            cols.forEach(c => {
                c.top = content.scrollTop - content.down + c.scrollTop + c.up;
                c.bot = c.scrollHeight - content.clientHeight - c.top;
                while (Math.floor(c.bot) > space(c, 1) && remove(c, 1));
                while (Math.floor(c.top) > space(c, -1) && remove(c, -1));
            })

            const s = c => Math.min(c.top, c.bot);
            let col = cols.reduce((a, c) => s(c) < s(a) ? c : a);
            if (col.top < col.bot && col.top <= pad) return add(col, -1);
            else if (col.bot <= pad) return add(col, 1);
            else cb();
        }

        content.down = 0;
        content.innerHTML = '';
        const cols = [...Array(n).keys()].map(col);
        let [shifting, filling, removed] = [false, false, () => !cols[0].parentElement];
        const f = c => filling || (filling = true, fill(c, () => filling = false));
        const s = c => shifting ? shifting = false : f(c);
        cols.forEach(c => c.onscroll = () => s([c]));
        content.onscroll = () => s(cols);
        window.onresize = () => f(cols);
        content.append(...cols);
        f(cols);

        controls.scroll.onclick = () => {
            filling = true;
            shuffle = !shuffle;
            query(shuffle, n);
            if (shuffle) {
                let scroll = content.scrollTop - content.down;
                content.classList.add('shuffle');
                content.down = 0;
                cols.forEach(c => {
                    c.scrollTop = scroll + c.up;
                    move(c, -c.up);
                })
            }
            else {
                const scroll = c => Math.round(c.scrollTop);
                content.down = Math.max(...cols.map(scroll));
                cols.forEach(c => move(c, scroll(c) - c.up));
                content.classList.remove('shuffle');
                content.scrollTop = content.down;
            }
            filling = false;
        }
    }

    const query = (shuffle, n = 0) => {
        n = Math.abs(n) * (shuffle ? -1 : 1);
        let query = '/' + (n === initial ? '' : `?${n}`);
        if (n) window.history.replaceState(null, '', query);
        let i = parseInt(window.location.search.slice(1)) || initial;
        n = Math.min(max, Math.max(min, Math.abs(i)));
        controls.minus.disabled = n === min;
        controls.plus.disabled = n === max;
        return [i < 0, n];
    }

    const toggle = (e, el) => {
        if (!e) el = document.body;
        else el = document.elementFromPoint(e.clientX, e.clientY);
        if (el === document.body) el = el.firstElementChild;
        if (el.tagName.toLowerCase() !== 'img') return;
        if (el.parentElement === document.body) {
            if (e && history.state) return history.back();
            el.onanimationend = () => el.remove();
            return el.classList.add('pop');
        }

        const f = (p => n => Math.round(n * p) / p)(1000);
        const set = (p, v, s = 'px') => c.style.setProperty('--' + p, f(v) + s);
        let [cw, ch, w, h] = [content.clientWidth, content.clientHeight];
        let [c, r] = [el.cloneNode(), el.getBoundingClientRect()];
        set('w', w = r.width), set('h', h = r.height);
        set('x', (cw - w) / 2), set('y', (ch - h) / 2);
        set('s', Math.min(cw / w, ch / h), '');
        set('l', r.left), set('t', r.top);
        document.body.prepend(c);

        window.history.pushState(true, '', '/' + window.location.search);
    }

    document.onclick = e => toggle(e);
    window.onpopstate = () => toggle();

    controls.minus.onclick = () => {
        if (n === min) return;
        n = Math.max(min, n - 1);
        controls.minus.disabled = n === min;
        query(shuffle, n);
        set();
    }

    controls.plus.onclick = () => {
        if (n === max) return;
        n = Math.min(max, n + 1);
        query(shuffle, n);
        set();
    }

    controls.heart.onclick = () => {
        controls.classList.toggle('open');
    }

    let [shuffle, n] = query();
    if (shuffle) content.classList.add('shuffle');
    let items = [];
    set();
}
