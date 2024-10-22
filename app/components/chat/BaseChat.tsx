import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import type { Message } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import React, { type ChangeEvent, type RefCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';

import styles from './BaseChat.module.scss';
import type { ModelType } from '~/lib/.server/llm/model';

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  defaultModel?: ModelType;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const EXAMPLE_PROMPTS = [
  { text: 'Tailwindを使ってReactでTodoアプリを作る' },
  { text: 'Astroを使ってシンプルなブログを構築する' },
  { text: 'Material UIを使用してクッキーの同意フォームを作成する' },
  { text: 'スペースインベーダーゲームを作る' },
  { text: 'divを中央揃えにするには？' },
];

const TEXTAREA_MIN_HEIGHT = 76;

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    const [selectedModel, setSelectedModel] = useState<string>("loading");
    const [cookies, setCookie] = useCookies(['uid']);

    useEffect(() => {

      const fetchModel = async () => {
        const res = await fetch(`${process.env.BASE_URL || "http://localhost:5173"}/api/model/get`, {
          method: "POST",
          body: new URLSearchParams({ uid: cookies.uid }),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        })
        const json = await res.json() as any
        setSelectedModel(json.model)
      }
  
      fetchModel();
      let model = selectedModel;
  
      console.log("Model is", model)
  
      
      const initialize = async () => {
        if (!cookies.uid) {
          const newUid = uuidv4(); // 新しいUUIDを生成
          setCookie('uid', newUid); // クッキーにuidを追加
          console.log(`New UID set: ${newUid}`);
        } else {
          console.log(`Existing UID found: ${cookies.uid}`);
        }

        if (!model) {
          await fetch("/api/model/set", {
            method: "POST",
            body: new URLSearchParams({ model: "claude-3-5-sonnet-20240620", uid: cookies.uid }),
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          });

          setSelectedModel("claude-3-5-sonnet-20240620")
        }
      };

      initialize(); // 即時呼び出し
    }, []);

    async function handleChange(event: ChangeEvent<HTMLSelectElement>): Promise<void> {
      setSelectedModel(event.target.value);

      await fetch("/api/model/set", {
        method: "POST",
        body: new URLSearchParams({ model: event.target.value, uid: cookies.uid }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    }

    return (
      <div
        ref={ref}
        className={classNames(
          styles.BaseChat,
          'relative flex h-full w-full overflow-hidden bg-bolt-elements-background-depth-1',
        )}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <div ref={scrollRef} className="flex overflow-y-auto w-full h-full">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[26vh] max-w-chat mx-auto">
                <h1 className="text-5xl text-center font-bold text-bolt-elements-textPrimary mb-2">
                  アイデアの始まり
                </h1>
                <p className="mb-4 text-center text-bolt-elements-textSecondary">
                  アイデアを一瞬でカタチに。今あるプロジェクトも、さらに強力にサポート。
                </p>
              </div>
            )}
            <div
              className={classNames('pt-6 px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className="flex flex-col w-full flex-1 max-w-chat px-4 pb-6 mx-auto z-1"
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames('relative w-full max-w-chat mx-auto z-prompt', {
                  'sticky bottom-0': chatStarted,
                })}
              >
                <select
                  aria-label="Model"
                  value={selectedModel}
                  onChange={handleChange}
                  style={{ marginBottom: 10 }}
                  className="w-full pl-4 h-10 pr-16 text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary"
                >
                  <option value="loading" hidden>Loading model infomation...</option>
                  <optgroup label="Anthropic">
                    <option value="claude-3-5-sonnet-20240620" >Claude 3.5 Sonnet (デフォルト)</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  </optgroup>
                  <optgroup label="OpenAI">
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="o1-preview">o1-preview (不安定)</option>
                  </optgroup>
                  <optgroup label="Google">
                    <option value="gemini-1.5-flash-exp-0827">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-pro-exp-0827">Gemini 1.5 Flash</option>
                  </optgroup>
                  <optgroup label="X (Grok)">
                    <option value="grok-2">Grok 2</option>
                    <option value="grok-2-mini">Grok 2 mini</option>
                  </optgroup>
                </select>

                <div
                  className={classNames(
                    'shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden',
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    className="w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage?.(event);
                      }
                    }}
                    value={input}
                    onChange={handleInputChange}
                    style={{
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder="Boltは今日、どのようにお手伝いできますか？"
                    translate="no"
                  />
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }
                          sendMessage?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  <div className="flex justify-between text-sm p-4 pt-2">
                    <div className="flex gap-1 items-center">
                      <IconButton
                        title="プロンプトを強化"
                        disabled={input.length === 0 || enhancingPrompt}
                        className={classNames({
                          'opacity-100!': enhancingPrompt,
                          'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!':
                            promptEnhanced,
                        })}
                        onClick={enhancePrompt}
                      >
                        {enhancingPrompt ? (
                          <>
                            <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl"></div>
                            <div className="ml-1.5">プロンプトの強化中...</div>
                          </>
                        ) : (
                          <>
                            <div className="i-bolt:stars text-xl"></div>
                            {promptEnhanced && <div className="ml-1.5">プロンプト強化済み</div>}
                          </>
                        )}
                      </IconButton>
                    </div>
                    {input.length > 3 && (
                      <div className="text-xs text-bolt-elements-textTertiary">
                        Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> で新しい行
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-bolt-elements-background-depth-1 pb-6">{/* Ghost Element */}</div>
              </div>
            </div>
            {!chatStarted && (
              <div id="examples" className="relative w-full max-w-xl mx-auto mt-8 flex justify-center">
                <div className="flex flex-col space-y-2 [mask-image:linear-gradient(to_bottom,black_0%,transparent_180%)] hover:[mask-image:none]">
                  {EXAMPLE_PROMPTS.map((examplePrompt, index) => (
                    <button
                      key={index}
                      onClick={(event) => {
                        sendMessage?.(event, examplePrompt.text);
                      }}
                      className="group flex items-center w-full gap-2 justify-center bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-theme"
                    >
                      {examplePrompt.text}
                      <div className="i-ph:arrow-bend-down-left" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);

