import React, { useEffect, useRef, useState } from "react";
import BpmnModeler from "bpmn-js/lib/Modeler";

// Import additional BPMN-JS modules
import minimapModule from "diagram-js-minimap";
import alignToOriginModule from "@bpmn-io/align-to-origin";
import gridModule from "diagram-js-grid";
import lintModule from "bpmn-js-bpmnlint";
import tokenSimulationModule from "bpmn-js-token-simulation";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";

import "./App.css";

// Custom User Task Provider
// First create a Base Provider that will handle the dragging functionality
class BaseCustomProvider {
  constructor(eventBus) {
    eventBus.on("drag.init", function (event) {
      event.stopPropagation();
    });
  }
}

BaseCustomProvider.$inject = ["eventBus"];

// Updated Custom User Task Provider
class CustomTaskProvider {
  constructor(palette, create, elementFactory, bpmnFactory, contextPad, modeling, connect) {
    this.palette = palette;
    this.create = create;
    this.elementFactory = elementFactory;
    this.bpmnFactory = bpmnFactory;
    this.contextPad = contextPad;
    this.modeling = modeling;
    this.connect = connect;

    palette.registerProvider(this);
    contextPad.registerProvider(this);
  }

  getPaletteEntries() {
    return {
      "create.user-task": {
        group: "activity",
        className: "bpmn-icon-user-task",
        title: "Create User Task",
        action: {
          dragstart: (event) => this.createUserTask(event),
          click: (event) => this.createUserTask(event),
        },
      },
      "create.service-task": {
        group: "activity",
        className: "bpmn-icon-service-task",
        title: "Create Service Task",
        action: {
          dragstart: (event) => this.createServiceTask(event),
          click: (event) => this.createServiceTask(event),
        },
      },
    };
  }

  getContextPadEntries(element) {
    return {
      'append.user-task': {
        group: 'model',
        className: 'bpmn-icon-user-task',
        title: 'Append User Task',
        action: {
          click: (event, element) => {
            const shape = this.createShape('bpmn:UserTask', 'User Task');
            const position = {
              x: element.x + element.width + 100,
              y: element.y
            };
            
            this.appendShape(element, shape, position);
          }
        }
      },
      'append.service-task': {
        group: 'model',
        className: 'bpmn-icon-service-task',
        title: 'Append Service Task',
        action: {
          click: (event, element) => {
            const shape = this.createShape('bpmn:ServiceTask', 'Service Task');
            const position = {
              x: element.x + element.width + 100,
              y: element.y
            };
            
            this.appendShape(element, shape, position);
          }
        }
      }
    };
  }

  createShape(type, name) {
    const businessObject = this.bpmnFactory.create(type, {
      name: name
    });

    return this.elementFactory.createShape({
      type: type,
      businessObject: businessObject,
      width: 100,
      height: 80
    });
  }

  appendShape(source, shape, position) {
    this.modeling.appendShape(source, shape, position);
    
    // Create a sequence flow connection
    const connection = this.modeling.connect(source, shape);
  }

  createUserTask(event) {
    const shape = this.createShape('bpmn:UserTask', 'User Task');
    this.create.start(event, shape);
  }

  createServiceTask(event) {
    const shape = this.createShape('bpmn:ServiceTask', 'Service Task');
    this.create.start(event, shape);
  }
}

CustomTaskProvider.$inject = [
  "palette",
  "create",
  "elementFactory",
  "bpmnFactory",
  "contextPad",
  "modeling",
  "connect"
];

// Create a complete custom module

const customModule = {
  __init__: ['customTaskProvider', 'baseCustomProvider'],
  baseCustomProvider: ['type', BaseCustomProvider],
  customTaskProvider: ['type', CustomTaskProvider]
};



const PropertiesPanel = ({ selectedElement, onPropertyChange }) => {
  const [localProperties, setLocalProperties] = useState({
    id: "",
    name: "",
    assignee: "",
    candidateUsers: "",
    candidateGroups: "",
    dueDate: "",
    priority: "",
    documentation: "",
  });

  useEffect(() => {
    if (selectedElement) {
      setLocalProperties({
        id: selectedElement.id || "",
        name: selectedElement.businessObject?.name || "",
        assignee: selectedElement.businessObject?.assignee || "",
        candidateUsers: selectedElement.businessObject?.candidateUsers || "",
        candidateGroups: selectedElement.businessObject?.candidateGroups || "",
        dueDate: selectedElement.businessObject?.dueDate || "",
        priority: selectedElement.businessObject?.priority || "",
        documentation:
          selectedElement.businessObject?.documentation?.[0]?.text || "",
      });
    }
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <div className="properties-placeholder">
        Select an element to edit properties
      </div>
    );
  }

  const handleInputChange = (property, value) => {
    setLocalProperties((prev) => ({
      ...prev,
      [property]: value,
    }));
    onPropertyChange(property, value);
  };

  return (
    <div className="properties-panel">
      <div className="property-group">
        <h3>General Properties</h3>
        <div className="property-row">
          <label>ID:</label>
          <input
            type="text"
            value={localProperties.id}
            onChange={(e) => handleInputChange("id", e.target.value)}
          />
        </div>
        <div className="property-row">
          <label>Name:</label>
          <input
            type="text"
            value={localProperties.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
          />
        </div>
        <div className="property-row">
          <label>Documentation:</label>
          <textarea
            value={localProperties.documentation}
            onChange={(e) => handleInputChange("documentation", e.target.value)}
            rows="3"
          />
        </div>
      </div>

      {selectedElement.type === "bpmn:UserTask" && (
        <div className="property-group">
          <h3>User Task Properties</h3>
          <div className="property-row">
            <label>Assignee:</label>
            <input
              type="text"
              value={localProperties.assignee}
              onChange={(e) => handleInputChange("assignee", e.target.value)}
              placeholder="Enter assignee"
            />
          </div>
          <div className="property-row">
            <label>Candidate Users:</label>
            <input
              type="text"
              value={localProperties.candidateUsers}
              onChange={(e) =>
                handleInputChange("candidateUsers", e.target.value)
              }
              placeholder="Comma-separated users"
            />
          </div>
          <div className="property-row">
            <label>Candidate Groups:</label>
            <input
              type="text"
              value={localProperties.candidateGroups}
              onChange={(e) =>
                handleInputChange("candidateGroups", e.target.value)
              }
              placeholder="Comma-separated groups"
            />
          </div>
          <div className="property-row">
            <label>Due Date:</label>
            <input
              type="datetime-local"
              value={localProperties.dueDate}
              onChange={(e) => handleInputChange("dueDate", e.target.value)}
            />
          </div>
          <div className="property-row">
            <label>Priority:</label>
            <input
              type="number"
              value={localProperties.priority}
              onChange={(e) => handleInputChange("priority", e.target.value)}
              placeholder="Task priority"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main Modeller Component
const Modeller = () => {const [modeler, setModeler] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const containerRef = useRef(null);

  const initialDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="sample-diagram"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1"/>
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds height="36.0" width="36.0" x="412.0" y="240.0"/>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>`;

  useEffect(() => {
    if (!containerRef.current) return;

    const bpmnModeler = new BpmnModeler({
      container: containerRef.current,
      additionalModules: [
        minimapModule,
        alignToOriginModule,
        gridModule,
        lintModule,
        tokenSimulationModule,
        customModule // Use the custom module instead of direct provider registration
      ],
      propertiesPanel: {
        parent: ".properties-container",
      },
      keyboard: {
        bindTo: document,
      },
      grid: {
        visible: true,
      },
      minimap: {
        open: true,
      },
      linting: {
        active: true,
      },
    });

    const setupModeler = async () => {
      try {
        const result = await bpmnModeler.importXML(initialDiagram);
        
        if (result.warnings.length) {
          console.warn("Warnings while importing BPMN diagram:", result.warnings);
        }

        const canvas = bpmnModeler.get("canvas");
        if (!canvas) {
          throw new Error("Canvas not found");
        }

        canvas.zoom("fit-viewport");

        bpmnModeler.on("selection.changed", ({ newSelection }) => {
          setSelectedElement(newSelection[0] || null);
        });

        bpmnModeler.on("element.changed", (event) => {
          if (event.element === selectedElement) {
            setSelectedElement({ ...event.element });
          }
        });

        setModeler(bpmnModeler);
      } catch (error) {
        console.error("Error setting up BPMN modeler:", error);
      }
    };

    setupModeler();

    return () => {
      if (bpmnModeler) {
        bpmnModeler.destroy();
      }
    };
  }, []);

  const handlePropertyChange = (property, value) => {
    if (!modeler || !selectedElement) return;

    const modeling = modeler.get("modeling");

    try {
      if (property === "id") {
        modeling.updateProperties(selectedElement, { id: value });
      } else {
        modeling.updateProperties(selectedElement, { [property]: value });
      }
    } catch (error) {
      console.error("Error updating properties:", error);
    }
  };

  const handleSave = async () => {
    if (!modeler) return;

    try {
      const { xml } = await modeler.saveXML({ format: true });
      const blob = new Blob([xml], { type: "text/xml" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "diagram.bpmn";
      link.click();
      URL.revokeObjectURL(link.href);
      console.log("Diagram saved successfully.");
    } catch (error) {
      console.error("Error saving diagram:", error);
    }
  };

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-group">
          <button onClick={handleSave}>Save Diagram</button>
        </div>
      </div>
      <div className="main-content">
        <div className="modeler-container" ref={containerRef}></div>
        <div className="properties-container">
          <PropertiesPanel
            selectedElement={selectedElement}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>
    </div>
  );
};

export default Modeller;
