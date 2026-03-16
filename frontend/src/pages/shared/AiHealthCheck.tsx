import React, { useEffect, useState } from 'react'
import { Alert, Button, Card, Descriptions, Result, Space, Spin, Tag, Typography } from 'antd'
import { ReloadOutlined, RobotOutlined } from '@ant-design/icons'
import { aiAPI } from '../../utils/api'

const { Paragraph, Text } = Typography

interface AiHealthData {
  success?: boolean
  ok?: boolean
  configured?: boolean
  provider?: string
  model?: string
  baseURL?: string
  message?: string
  timestamp?: string
}

const AiHealthCheck: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AiHealthData | null>(null)

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const response = await aiAPI.getHealth()
      setData(response)
    } catch (error: any) {
      const fallback = error?.response?.data
      setData(
        fallback || {
          ok: false,
          configured: false,
          message: '无法连接后端 AI 检测接口',
        },
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchHealth()
  }, [])

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '56px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  const ok = Boolean(data?.ok)
  const configured = Boolean(data?.configured)

  return (
    <div className="page-container">
      <Card
        title="AI 连通性检测"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => void fetchHealth()}>
            重新检测
          </Button>
        }
      >
        <Result
          status={ok ? 'success' : configured ? 'warning' : 'error'}
          title={ok ? 'AI 服务连接正常' : configured ? '已配置 API Key，但当前连接失败' : '尚未配置 AI Key'}
          subTitle={data?.message || '暂无检测结果'}
          icon={<RobotOutlined />}
        />

        <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="服务商">
            {data?.provider || 'unknown'}
          </Descriptions.Item>
          <Descriptions.Item label="模型">
            {data?.model || 'unknown'}
          </Descriptions.Item>
          <Descriptions.Item label="接口地址">
            {data?.baseURL || 'unknown'}
          </Descriptions.Item>
          <Descriptions.Item label="API Key 状态">
            <Tag color={configured ? 'green' : 'red'}>{configured ? '已配置' : '未配置'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="连通状态">
            <Tag color={ok ? 'green' : 'orange'}>{ok ? '正常' : '失败'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="检测时间">
            {data?.timestamp ? new Date(data.timestamp).toLocaleString() : '未知'}
          </Descriptions.Item>
        </Descriptions>

        {!ok && (
          <Alert
            type="warning"
            showIcon
            message="排查建议"
            description={
              <Space direction="vertical" size="small">
                <Text>1. 确认后端 `.env` 中的 `DEEPSEEK_API_KEY` 已填写。</Text>
                <Text>2. 确认本机可以访问 `https://api.deepseek.com`。</Text>
                <Text>3. 如果提示 `Connection error.`，通常是网络、代理或防火墙问题，不是前端按钮本身坏了。</Text>
              </Space>
            }
          />
        )}

        <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          学生端“智能生成选题 / 任务书 / 开题 / 中期”和教师端“AI 评分 / AI 评语”现在都依赖这里的连通状态。
        </Paragraph>
      </Card>
    </div>
  )
}

export default AiHealthCheck
