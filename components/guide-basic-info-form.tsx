import type React from "react"
import type { FormState, FormAction } from "./publish-guide" // Assuming types remain in publish-guide for now

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ToggleInput } from "@/components/ui/toggle-input"
import { TagSelector } from "@/components/input/tag-selector"
import { ContributionInput } from "@/components/input/contribution-input"
import { NumberInput } from "@/components/input/number-input"

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
            <div className="text-sm text-muted-foreground text-right">
              {formState.description.length}/50
            </div>
          </div>

          <div className="space-y-2">
            <TagSelector
              selectedTags={formState.tags}
              onTagSelect={(newTags) => dispatch({ type: 'SET_TAGS', payload: newTags })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 