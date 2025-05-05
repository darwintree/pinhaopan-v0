import type React from "react"
import { X } from 'lucide-react'

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ToggleInput } from "@/components/ui/toggle-input"
import { TagSelector } from "@/components/input/tag-selector"
import { ContributionInput } from "@/components/input/contribution-input"
import { NumberInput } from "@/components/input/number-input"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { validateUrl } from "@/lib/validation"

interface GuideBasicInfoFormProps {
  formState: FormState
  dispatch: React.Dispatch<FormAction>
  selectedQuest: string
  questList: Array<{ quest: string; name: string }> // Consider defining a more specific type if available elsewhere
}

export function GuideBasicInfoForm({
  formState,
  dispatch,
  selectedQuest,
  questList,
}: GuideBasicInfoFormProps) {
  return (
    <Card className="backdrop-blur-lg bg-white/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-700/50 shadow-sm">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <h2 className="text-2xl font-bold mb-4 sm:mb-6">配置基本信息</h2>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>已选副本</Label>
              <div className="p-3 rounded-md bg-slate-100/50 dark:bg-slate-800/50">
                {selectedQuest ? (
                  <span className="font-medium">
                    {questList.find(quest => quest.quest === selectedQuest)?.name}
                  </span>
                ) : (
                  <span className="text-muted-foreground">请先选择副本</span>
                )}
              </div>
            </div>

            <ToggleInput
              id="time"
              label="消耗时间"
              tooltipText="完成副本所需的时间（分:秒），可选"
              enabled={formState.isTimeEnabled}
              onToggle={() => dispatch({ type: 'TOGGLE_FIELD', field: 'isTimeEnabled' })}
            >
              <div className="flex items-center justify-end">
                <span className="text-sm text-muted-foreground">
                  {Math.floor(formState.time / 60)}分{formState.time % 60}秒
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="minutes" className="text-xs text-muted-foreground">分钟</Label>
                  <div className="flex items-center">
                    <NumberInput
                      id="minutes"
                      value={Math.floor(formState.time / 60)}
                      onChange={(newValue) => {
                        const min = newValue ?? 0;
                        const currentSeconds = formState.time % 60;
                        dispatch({ type: 'SET_FIELD', field: 'time', value: (min * 60) + currentSeconds });
                      }}
                      min={0}
                      max={59}
                      placeholder="0"
                      disabled={!formState.isTimeEnabled}
                      inputClassName="text-center"
                      allowDecimal={false}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="seconds" className="text-xs text-muted-foreground">秒</Label>
                  <div className="flex items-center">
                    <NumberInput
                      id="seconds"
                      value={formState.time % 60}
                      onChange={(newValue) => {
                        const sec = newValue ?? 0;
                        const currentMinutes = Math.floor(formState.time / 60);
                        dispatch({ type: 'SET_FIELD', field: 'time', value: (currentMinutes * 60) + sec });
                      }}
                      min={0}
                      max={59}
                      placeholder="0"
                      disabled={!formState.isTimeEnabled}
                      inputClassName="text-center"
                      allowDecimal={false}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Slider
                  id="time-slider"
                  min={0}
                  max={3600}
                  step={1}
                  value={[formState.time]}
                  onValueChange={(value) => dispatch({ type: 'SET_FIELD', field: 'time', value: value[0] })}
                />
              </div>
            </ToggleInput>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            {/* 回合数输入项 */}
            <ToggleInput
              id="turn"
              label="回合数"
              tooltipText="通关所需的回合数，可选"
              enabled={formState.isTurnEnabled}
              onToggle={() => dispatch({ type: 'TOGGLE_FIELD', field: 'isTurnEnabled' })}
            >
              <div className="pt-2">
                <NumberInput
                  id="turn"
                  value={formState.turn}
                  onChange={(newValue) => dispatch({ type: 'SET_FIELD', field: 'turn', value: newValue ?? 1 })}
                  min={1}
                  placeholder="1"
                  disabled={!formState.isTurnEnabled}
                  inputClassName="text-center"
                  allowDecimal={false}
                />
              </div>
            </ToggleInput>

            {/* 贡献度输入项 */}
            <ToggleInput
              id="contribution"
              label="贡献度"
              tooltipText="战斗贡献度，可选"
              enabled={formState.isContributionEnabled}
              onToggle={() => dispatch({ type: 'TOGGLE_FIELD', field: 'isContributionEnabled' })}
            >
              <ContributionInput 
                id="contribution-value" 
                value={formState.contribution}
                onChange={(newValue) => dispatch({ type: 'SET_FIELD', field: 'contribution', value: newValue })}
                className="pt-2"
                disabled={!formState.isContributionEnabled}
              />
            </ToggleInput>
          </div>

          {/* 按键数输入项 */}
          <div className="mt-6">
            <ToggleInput
              id="button"
              label="按键数"
              tooltipText="战斗中使用的技能和召唤按键数量，可选"
              enabled={formState.isButtonEnabled}
              onToggle={() => dispatch({ type: 'TOGGLE_FIELD', field: 'isButtonEnabled' })}
            >
              <div className="grid gap-4 md:grid-cols-2 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="buttonSkill" className="text-xs text-muted-foreground">技能按键数</Label>
                  <NumberInput
                    id="buttonSkill"
                    value={formState.buttonSkill}
                    onChange={(newValue) => dispatch({ type: 'SET_FIELD', field: 'buttonSkill', value: newValue ?? 0 })}
                    min={0}
                    placeholder="0"
                    disabled={!formState.isButtonEnabled}
                    inputClassName="text-center"
                    allowDecimal={false}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonSummon" className="text-xs text-muted-foreground">召唤按键数</Label>
                  <NumberInput
                    id="buttonSummon"
                    value={formState.buttonSummon}
                    onChange={(newValue) => dispatch({ type: 'SET_FIELD', field: 'buttonSummon', value: newValue ?? 0 })}
                    min={0}
                    placeholder="0"
                    disabled={!formState.isButtonEnabled}
                    inputClassName="text-center"
                    allowDecimal={false}
                  />
                </div>
              </div>
            </ToggleInput>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">备注</Label>
            <Textarea
              id="description"
              placeholder="配置简要备注（不超过50字）"
              className="min-h-[120px]"
              value={formState.description}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
            />
            <div className={`text-sm text-right ${formState.description.length > 50 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {formState.description.length}/50
            </div>
          </div>

          <div className="space-y-2">
            <TagSelector
              selectedTags={formState.tags}
              onTagSelect={(newTags) => dispatch({ type: 'SET_TAGS', payload: newTags })}
            />
          </div>

          {/* Links Input Area */}
          <div className="space-y-2">
            <Label>相关链接 (最多5个)</Label>
            <div className="space-y-2">
              {formState.links.map((link, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="url"
                      placeholder="输入链接 (例如 https://...)"
                      value={link}
                      onChange={(e) =>
                        dispatch({
                          type: 'UPDATE_LINK',
                          payload: { index, value: e.target.value },
                        })
                      }
                      className={`flex-grow ${formState.linkErrors[index] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        dispatch({ type: 'REMOVE_LINK', payload: { index } })
                      }
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {formState.linkErrors[index] && (
                    <p className="text-xs text-red-500 mt-1">
                      {formState.linkErrors[index]}
                    </p>
                  )}
                </div>
              ))}
            </div>
            {formState.links.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: 'ADD_LINK' })}
                className="mt-2"
              >
                添加链接
              </Button>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  )
}// Define state interface for the form

export interface FormState {
  time: number
  isTimeEnabled: boolean
  turn: number
  isTurnEnabled: boolean
  contribution: number
  isContributionEnabled: boolean
  buttonSkill: number
  buttonSummon: number
  isButtonEnabled: boolean
  description: string
  tags: string[]
  links: string[]
  linkErrors: string[] // 存储每个链接的错误信息
}
// Define action types for the reducer

export type FormAction = { type: 'SET_FIELD'; field: keyof Omit<FormState, 'links' | 'linkErrors'>; value: any}  | // Exclude 'links' from SET_FIELD
{ type: 'TOGGLE_FIELD'; field: 'isTimeEnabled' | 'isTurnEnabled' | 'isContributionEnabled' | 'isButtonEnabled'}  |
{ type: 'SET_TAGS'; payload: string[]}  |
{ type: 'RESET_FORM'}  |
// 新增 Link 相关操作
{ type: 'ADD_LINK' } |
{ type: 'UPDATE_LINK'; payload: { index: number; value: string } } |
{ type: 'REMOVE_LINK'; payload: { index: number } }
// Define the initial state for the form
export const initialFormState: FormState = {
  time: 300,
  isTimeEnabled: false,
  turn: 1,
  isTurnEnabled: false,
  contribution: 1000000,
  isContributionEnabled: false,
  buttonSkill: 0,
  buttonSummon: 0,
  isButtonEnabled: false,
  description: "",
  tags: [],
  links: [],
  linkErrors: [], // 初始化空数组
}
// Define the reducer function
export const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }
    case 'TOGGLE_FIELD':
      return { ...state, [action.field]: !state[action.field] }
    case 'SET_TAGS':
      return { ...state, tags: action.payload }
    case 'ADD_LINK':
      // 最多允许添加5个链接 (或其他合理限制)
      if (state.links.length >= 5) {
        return state;
      }
      return { 
        ...state, 
        links: [...state.links, ''], 
        linkErrors: [...state.linkErrors, ''] // 为新链接添加空错误信息
      }
    case 'UPDATE_LINK': {
      const { index, value } = action.payload;
      const newLinks = state.links.map((link, i) =>
        i === index ? value : link
      );
      
      // 更新错误信息
      const newLinkErrors = [...state.linkErrors];
      
      // 使用 try-catch 捕获验证错误
      try {
        validateUrl(value);
        newLinkErrors[index] = ''; // 验证通过，清除错误
      } catch (error) {
        newLinkErrors[index] = error instanceof Error ? error.message : '无效链接';
      }
      
      return {
        ...state,
        links: newLinks,
        linkErrors: newLinkErrors,
      };
    }
    case 'REMOVE_LINK': {
      const { index } = action.payload;
      return {
        ...state,
        links: state.links.filter((_, i) => i !== index),
        linkErrors: state.linkErrors.filter((_, i) => i !== index), // 同时移除对应的错误信息
      };
    }
    case 'RESET_FORM':
      return initialFormState // initialFormState 已包含 linkErrors: []
    default:
      return state
  }
}
 