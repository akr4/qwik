import { Fragment as Component, Fragment } from '@builder.io/qwik/jsx-runtime';
import { describe, expect, it } from 'vitest';
import { trigger } from '../../testing/element-fixture';
import { component$ } from '../component/component.public';
import { inlinedQrl } from '../qrl/qrl';
import { useLexicalScope } from '../use/use-lexical-scope.public';
import { useSignal } from '../use/use-signal';
import { domRender, ssrRenderToDom } from './rendering.unit-util';
import './vdom-diff.unit-util';

const debug = false; //true;
Error.stackTraceLimit = 100;

describe('useSequentialScope', () => {
  it('should render component', async () => {
    const MyComp = component$(() => {
      return <>Hello World!</>;
    });

    const { vNode, container } = await ssrRenderToDom(<MyComp />, { debug: false });
    await trigger(container.element, 'button', 'click');
    expect(vNode).toMatchVDOM(
      <>
        <>Hello World!</>
      </>
    );
  });
  it('should render nested component', async () => {
    const Parent = component$((props: { salutation: string; name: string }) => {
      return (
        <>
          {props.salutation} <Child name={props.name} />
        </>
      );
    });

    const Child = component$((props: { name: string }) => {
      return <>{props.name}</>;
    });

    const { vNode, container } = await ssrRenderToDom(<Parent salutation="Hello" name="World" />, {
      // debug: true,
    });
    await trigger(container.element, 'button', 'click');
    expect(vNode).toMatchVDOM(
      <Component>
        <Fragment>
          {'Hello'}{' '}
          <Component>
            <Fragment>World</Fragment>
          </Component>
        </Fragment>
      </Component>
    );
  });
  [
    ssrRenderToDom, //
    domRender, //
  ].forEach((render) => {
    describe(`render: ${render.name}`, () => {
      it('should show Child Component', async () => {
        const Child = component$(() => {
          return <div>Child</div>;
        });
        const Parent = component$(() => {
          const showChild = useSignal(false);
          return (
            <>
              <div>Parent</div>
              <div>
                <button
                  onClick$={inlinedQrl(
                    () => {
                      const [showChild] = useLexicalScope();
                      showChild.value = !showChild.value;
                    },
                    's_onClick',
                    [showChild]
                  )}
                >
                  Show child
                </button>
                {showChild.value && <Child />}
              </div>
            </>
          );
        });

        const { vNode, document } = await render(<Parent />, { debug });
        expect(vNode).toMatchVDOM(
          <Component>
            <Fragment>
              <div>Parent</div>
              <div>
                <button>Show child</button>
                {''}
              </div>
            </Fragment>
          </Component>
        );
        await trigger(document.body, 'button', 'click');
        expect(vNode).toMatchVDOM(
          <Component>
            <Fragment>
              <div>Parent</div>
              <div>
                <button>Show child</button>
                <Component>
                  <div>Child</div>
                </Component>
              </div>
            </Fragment>
          </Component>
        );
      });
    });
  });
});