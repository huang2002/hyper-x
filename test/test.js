// @ts-check
///<reference types=".." />

const h = X.createElement;

const title = X.Value.wrap({
    content: 'Hello, world!',
    color: '#000'
});

const LABEL_CLASS = X.createClass({
    _: {
        display: 'inline-block',
        width: '8em',
        margin: '0 0 1em'
    }
});

const inputWidth = X.Value.of(10);

const INPUT_CLASS = X.createClass({
    _: {
        width: inputWidth.mapSync(function (n) { return n + 'em'; }),
        padding: '.2em .4em',
        border: 'solid 1px #666',
        'border-radius': '3px'
    },
    '_:focus': {
        'box-shadow': '0 0 5px #999',
        outline: 'none'
    }
});

const RANGE_CLASS = X.createClass({
    _: {
        position: 'relative',
        overflow: 'visible'
    },
    '_:focus::after': {
        content: 'attr(data-value)',
        position: 'absolute',
        display: 'inline-block',
        left: '0',
        right: '0',
        top: '100%',
        'text-align': 'center',
        color: '#444'
    }
});

function Label(options, content) {
    return h('label', Object.assign({ class: LABEL_CLASS }, options), content + ': ');
}

function Input(options) {
    return h('input', Object.assign({ class: INPUT_CLASS }, options));
}

function LabelledInput(id, label, inputOptions) {
    return [
        Label({ for: id }, label),
        Input(Object.assign({ id: id }, inputOptions))
    ];
}

function TitleTest() {
    return X.createFragment([
        h('h1', { id: 'title', style: X.Value.joinSync(['color', title.color], ':') }, title.content),
        LabelledInput('title-content-input', 'title content', {
            bind: title.content,
            listeners: {
                input: [
                    function () {
                        console.log('title changed')
                    },
                    { once: true }
                ]
            }
        }),
        h('br'),
        LabelledInput('title-color-input', 'title color', { bindSync: title.color }),
        h('br'),
        LabelledInput('input-width-input', 'input width', {
            class: [],
            'data-value': inputWidth,
            bind: inputWidth,
            type: 'range',
            max: 20,
            min: 6
        }),
        ' (em)'
    ]);
}

function TextareaTest() {
    const content = X.Value.of('<h1>Textarea Test</h1>');
    return [
        h('div', { html: content }),
        h('textarea', {
            cols: 50,
            rows: 15,
            bind: content
        })
    ];
}

/** @type {X.Value<'title' | 'textarea'>} */
const router = X.Value.of('title');

X.appendChildren(
    document.body, [
        X.createElement('div', null,
            X.createRouter(router, {
                title: TitleTest,
                textarea: TextareaTest
            })
        ),
        X.createElement('div',
            {
                style: 'margin-top: 1em;'
            },
            'Select test:　',
            X.createElement('select', {
                bind: router,
                listeners: {
                    change: function () {
                        console.log('test changed');
                    }
                }
            },
                X.createElement('option', { value: 'title' }, 'Title Test'),
                X.createElement('option', { value: 'textarea' }, 'Textarea Test')
            )
        )
    ]
);
