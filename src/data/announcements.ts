import { Announcement } from '@/types';

const today = new Date();

export const announcements: Announcement[] = [
  {
    id: 'a1',
    title: '【重要通知】工具借用规则更新',
    content: '为了更好地服务业主，自2026年1月1日起，工具借用押金将采用线上支付方式，不再收取现金。逾期归还将产生逾期费用，每天按日租金的50%计算。感谢您的配合！',
    type: 'rule',
    priority: 'important',
    createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a2',
    title: '【常见问题】如何预约热门工具？',
    content: '对于电钻、梯子等热门工具，建议提前3-5天在线预约。如遇急需，可联系物业前台查询是否有临时取消的预约。每位业主每次最多可预约3件工具，借用时长不超过7天。',
    type: 'faq',
    priority: 'normal',
    createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a3',
    title: '【通知】新增电动扳手、管道疏通器',
    content: '应业主要求，物业新购置了2台电动扳手和3台管道疏通器，现已入库可借。欢迎有需要的业主前来预约使用！',
    type: 'notice',
    priority: 'normal',
    createdAt: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a4',
    title: '【常见问题】工具损坏如何赔偿？',
    content: '归还时如发现工具损坏，物业将根据损坏程度评估赔偿金额：轻微损坏（不影响使用）赔偿原价的10%-30%；中度损坏（需维修）赔偿原价的30%-70%；严重损坏（无法维修）按原价赔偿。具体金额以物业评估为准。',
    type: 'faq',
    priority: 'normal',
    createdAt: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'a5',
    title: '【通知】春节期间工具借用安排',
    content: '2026年春节期间（2月10日-2月17日），工具借用服务照常开放，但归还日期需提前安排。2月9日（除夕）下午16:00后停止借出，2月18日（正月初七）恢复正常服务。请业主朋友们合理安排借用时间。',
    type: 'notice',
    priority: 'important',
    createdAt: new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
