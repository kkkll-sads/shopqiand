
/** 快捷问题列表 */
const QUICK_QUESTIONS = [
  '账户相关问题',
  '交易流程咨询',
  '提现与到账时间',
  '平台规则与协议',
];

/** 初始消息 */
const initialMessages: ChatMessage[] = [
  {
    id: 1,
    from: 'service',
    content: '您好，这里是在线客服中心，请简单描述您的问题，我们会尽快为您解答。',
    time: '刚刚',
  },
];

/**
 * OnlineService 在线客服页面组件
 */
const OnlineService: React.FC<OnlineServiceProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [nextId, setNextId] = useState(2);

  /**
   * 添加消息
   */
  const pushMessage = (from: ChatMessage['from'], content: string) => {
    const newMsg: ChatMessage = {
      id: nextId,
      from,
      content,
      time: '刚刚',
    };
    setMessages((prev) => [...prev, newMsg]);
    setNextId((id) => id + 1);
  };

  /**
   * 发送消息
   */
  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    pushMessage('user', text);

    // 模拟客服回复
    setTimeout(() => {
      pushMessage(
        'service',
        '已收到您的消息，当前为模拟客服示例。如需正式接入，可对接在线客服系统接口。'
      );
    }, 500);
  };

  /**
   * 选择快捷问题
   */
  const handleQuickQuestion = (q: string) => {
    setInput(q);
  };

  return (
    <PageContainer title="在线客服" onBack={onBack} padding={false}>
      <div className="flex flex-col h-[calc(100vh-56px)] bg-gray-50">
        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs leading-5 ${msg.from === 'user'
                  ? 'bg-orange-500 text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* 快捷问题 */}
        <div className="px-3 pb-2 space-y-2">
          <div className="text-[11px] text-gray-400">常见问题快捷输入</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[11px] text-gray-700 active:bg-gray-50"
                onClick={() => handleQuickQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 输入框 */}
        <div className="bg-white border-t border-gray-100 px-3 py-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="请输入您要咨询的问题..."
            className="flex-1 text-xs px-3 py-2 rounded-full border border-gray-200 outline-none placeholder:text-gray-300"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-medium active:opacity-80 disabled:opacity-40"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            发送
          </button>
        </div>
      </div>
    </PageContainer>
  );
};

export default OnlineService;
