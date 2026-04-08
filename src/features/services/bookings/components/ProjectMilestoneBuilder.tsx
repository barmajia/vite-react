// src/features/services/bookings/components/ProjectMilestoneBuilder.tsx
import React from "react";
import {
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  GripVertical,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
}

interface ProjectMilestoneBuilderProps {
  milestones: Milestone[];
  onChange: (milestones: Milestone[]) => void;
  currency: string;
}

export const ProjectMilestoneBuilder: React.FC<
  ProjectMilestoneBuilderProps
> = ({ milestones, onChange, currency }) => {
  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      description: "",
      amount: 0,
      dueDate: "",
    };
    onChange([...milestones, newMilestone]);
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    const updated = milestones.map((m) =>
      m.id === id ? { ...m, [field]: value } : m,
    );
    onChange(updated);
  };

  const removeMilestone = (id: string) => {
    onChange(milestones.filter((m) => m.id !== id));
  };

  const totalAmount = milestones.reduce(
    (sum, m) => sum + (Number(m.amount) || 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black italic tracking-tighter uppercase">
            Project <span className="text-primary italic">Milestones</span>
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
            Define your phased deployment strategy
          </p>
        </div>
        <Button
          onClick={addMilestone}
          className="h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest px-6"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Phase
        </Button>
      </div>

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-white/5 rounded-[2rem] text-center space-y-4 bg-white/5">
            <div className="w-12 h-12 rounded-2xl glass bg-white/5 flex items-center justify-center mx-auto opacity-20">
              <GripVertical className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20 italic">
              No Phases Defined - Start adding milestones to build your roadmap
            </p>
          </div>
        ) : (
          milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5 relative group animate-in slide-in-from-bottom-4 duration-500"
            >
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-black italic shadow-lg shadow-primary/20 z-10">
                {index + 1}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-12 flex justify-between items-center border-b border-white/5 pb-4">
                  <Input
                    value={milestone.title}
                    onChange={(e) =>
                      updateMilestone(milestone.id, "title", e.target.value)
                    }
                    placeholder="PHASE TITLE (e.g. Initial Prototype Architecture)"
                    className="bg-transparent border-0 text-xl font-black italic tracking-tighter uppercase placeholder:text-white/10 p-0 focus:ring-0 h-auto"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => removeMilestone(milestone.id)}
                    className="h-10 w-10 p-0 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="md:col-span-8">
                  <Textarea
                    value={milestone.description}
                    onChange={(e) =>
                      updateMilestone(
                        milestone.id,
                        "description",
                        e.target.value,
                      )
                    }
                    placeholder="DETAILED SPECS FOR THIS DEPLOYMENT PHASE..."
                    className="bg-white/5 border-white/5 rounded-2xl min-h-[100px] p-4 text-[10px] font-black uppercase tracking-widest placeholder:text-white/5 resize-none focus:border-primary/40 transition-all"
                  />
                </div>

                <div className="md:col-span-4 space-y-4">
                  <div className="relative group/field">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/field:text-primary transition-colors" />
                    <Input
                      type="number"
                      value={milestone.amount}
                      onChange={(e) =>
                        updateMilestone(
                          milestone.id,
                          "amount",
                          parseFloat(e.target.value),
                        )
                      }
                      placeholder="PHASE VALUE"
                      className="bg-white/5 border-white/5 rounded-2xl h-14 pl-12 text-xs font-black uppercase tracking-widest focus:border-primary/40 transition-all"
                    />
                  </div>
                  <div className="relative group/field">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within/field:text-primary transition-colors" />
                    <Input
                      type="date"
                      value={milestone.dueDate}
                      onChange={(e) =>
                        updateMilestone(milestone.id, "dueDate", e.target.value)
                      }
                      className="bg-white/5 border-white/5 rounded-2xl h-14 pl-12 text-xs font-black uppercase tracking-widest focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between p-8 rounded-[2rem] glass bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-4">
          <CheckCircle2 className="h-8 w-8 text-primary opacity-40" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
              Combined Project Value
            </p>
            <h4 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
              {currency} {totalAmount.toLocaleString()}
            </h4>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic animate-pulse">
            Vault Protection Active
          </p>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">
            Funds held in escrow by Aurora Protocol
          </p>
        </div>
      </div>
    </div>
  );
};
