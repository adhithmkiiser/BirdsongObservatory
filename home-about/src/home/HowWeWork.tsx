import React, { useState, useEffect } from 'react';
import { Mic, Cpu, BarChart3, Users } from 'lucide-react';

interface WorkflowStep {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HowWeWork: React.FC = () => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    const s1Title = localStorage.getItem('workflowStepTitle1') || 'Data Collection';
    const s1Desc = localStorage.getItem('workflowStepDesc1') || 
      'Standardized spaced sampling protocol with a minimum distance of 600m to 700m between recording stations to reduce acoustic overlap and ensure representative sampling.';
    
    const s2Title = localStorage.getItem('workflowStepTitle2') || 'Automated Processing & Classification';
    const s2Desc = localStorage.getItem('workflowStepDesc2') || 
      'Raw audio recordings are analyzed using BirdNET and customized acoustic classifiers to identify species detections with high temporal resolution and confidence scores.';

    const s3Title = localStorage.getItem('workflowStepTitle3') || 'Ecological Analysis & Dashboards';
    const s3Desc = localStorage.getItem('workflowStepDesc3') || 
      'Detections are aggregated to evaluate species richness, indicator presence, and community structure. Insights are visualised in real-time dashboards and detailed reports.';

    const s4Title = localStorage.getItem('workflowStepTitle4') || 'Stakeholder Collaboration';
    const s4Desc = localStorage.getItem('workflowStepDesc4') || 
      'Ecological insights and dashboard utilities are shared directly with forest departments, NGOs, land managers, and research teams to support evidence-based conservation.';

    const defaultSteps: WorkflowStep[] = [
      {
        id: 1,
        icon: <Mic className="step-icon-svg" />,
        title: s1Title,
        description: s1Desc,
      },
      {
        id: 2,
        icon: <Cpu className="step-icon-svg" />,
        title: s2Title,
        description: s2Desc,
      },
      {
        id: 3,
        icon: <BarChart3 className="step-icon-svg" />,
        title: s3Title,
        description: s3Desc,
      },
      {
        id: 4,
        icon: <Users className="step-icon-svg" />,
        title: s4Title,
        description: s4Desc,
      },
    ];

    setSteps(defaultSteps);
  }, []);

  return (
    <section className="workflow-section">
      <div className="workflow-container">
        <div className="section-title-area">
          <span className="section-pre">Scientific Workflow</span>
          <h2 className="section-main-heading">How We Work</h2>
          <div className="section-title-line" />
        </div>

        <div className="workflow-timeline">
          {/* Vertical connecting line */}
          <div className="workflow-line" />

          {steps.map((step, idx) => (
            <div className={`workflow-step-card ${idx % 2 === 0 ? 'left' : 'right'}`} key={step.id}>
              {/* Visual Dot on Timeline */}
              <div className="workflow-timeline-dot">
                <span className="dot-num">{step.id}</span>
              </div>

              {/* Step Content */}
              <div className="workflow-step-content">
                <div className="step-icon-wrapper">
                  {step.icon}
                </div>
                <div className="step-text-wrapper">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowWeWork;
