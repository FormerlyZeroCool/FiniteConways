import {SingleTouchListener, isTouchSupported, MultiTouchListener, KeyboardHandler, TouchMoveEvent, MultiTouchEvent} from './io.js'
import {getHeight, getWidth, RGB, Sprite, GuiCheckList, GuiButton, SimpleGridLayoutManager, GuiLabel, GuiListItem, GuiSlider, SlideEvent, GuiCheckBox, 
    GuiColoredSpacer, ExtendedTool, vertical_group, horizontal_group, CustomBackgroundSlider, StateManagedUI, UIState, GuiSpacer, is_landscape, GuiElement, groupify, VerticalLayoutManager, StateManagedUIElement, HorizontalLayoutManager} from './gui.js'
import {sign, srand, clamp, max_32_bit_signed, round_with_precision, saveBlob, FixedSizeQueue, Queue, PriorityQueue, logToServer, sleep, DynamicFloat64Array} from './utils.js'
import {magnitude, menu_font_size, SpatialHashMap2D, SquareAABBCollidable } from './game_utils.js'
window.sec = (x:number) => 1/Math.sin(x);
window.csc = (x:number) => 1/Math.cos(x);
window.cotan = (x:number) => 1/Math.tan(x);
window.sin = Math.sin;
window.cos = Math.cos;
window.tan = Math.tan;
window.asin = Math.asin;
window.acos = Math.acos;
window.atan = Math.atan;
window.log = Math.log;
window.pow = Math.pow;
window.sqrt = Math.sqrt;
const derx = (foo:(x:number, dx:number) => number, x:number, dx:number) => {
    return (foo(x + dx, dx) - foo(x, dx)) / dx;
};
window.derx = derx;
const dderx =  (foo:(x:number, dx:number) => number, x:number, dx:number) => {
    return (derx(foo, x + dx, dx) - derx(foo, x, dx)) / dx;
};
window.dderx = dderx;

class ColorPickerTool extends ExtendedTool {
    chosenColor:GuiColoredSpacer;
    hueSlider:CustomBackgroundSlider;
    saturationSlider:CustomBackgroundSlider;
    lightnessSlider:CustomBackgroundSlider;
    buttonInvertColors:GuiButton;

    constructor(color_changed:(color:RGB) => void, toolName:string = "color picker", pathToImage:string[] = ["images/colorPickerSprite.png"], optionPanes:SimpleGridLayoutManager[] = [])
    {
        super(null, pathToImage, optionPanes, [200, 200], [4, 50]);
        this.chosenColor = new GuiColoredSpacer([100, 32], new RGB(0,150,150,255), () => document.body.style.backgroundColor = this.chosenColor.color.htmlRBG());
        const colorSlideEvent:(event:SlideEvent) => void = (event:SlideEvent) => {
            const color:RGB = new RGB(0, 0, 0, 0);
            color.setByHSL(this.hueSlider.state * 360, this.saturationSlider.state, this.lightnessSlider.state);
            color.setAlpha(255);
            this.color().copy(color);
            this._setColorText();
            color_changed(color);
            this.hueSlider.refresh();
            this.saturationSlider.refresh();
            this.lightnessSlider.refresh();
        };    
        const slider_height = 50;
        this.hueSlider = new CustomBackgroundSlider(0, [150, slider_height], colorSlideEvent, 
            (ctx:CanvasRenderingContext2D, x:number, y:number, width:number, height:number) => {
                const color:RGB = new RGB(0, 0, 0, 0);
                if(this.color())
                {
                    const hsl:number[] = [this.hueSlider.state * 360, this.saturationSlider.state, this.lightnessSlider.state];

                    const unitStep:number = 1 / width;
                    let i = 0;
                    for(let j = 0; j < 1; j += unitStep)
                    {
                        hsl[0] = j * 360;
                        color.setByHSL(hsl[0], hsl[1], hsl[2]);
                        color.setAlpha(this.color().alpha());
                        ctx.fillStyle = color.htmlRBGA();
                        ctx.fillRect(j * width + x, y, unitStep * width, height);
                    }
                }
        });
        this.saturationSlider = new CustomBackgroundSlider(1, [150, slider_height], colorSlideEvent, 
            (ctx:CanvasRenderingContext2D, x:number, y:number, width:number, height:number) => {
                const color:RGB = new RGB(0, 0, 0, 0);
                if(this.color())
                {
                    const hsl:number[] = [this.hueSlider.state * 360, this.saturationSlider.state, this.lightnessSlider.state];
                    
                    const unitStep:number = 1 / width;
                    let i = 0;
                    for(let j = 0; j < 1; j += unitStep)
                    {
                        color.setByHSL(hsl[0], j, hsl[2]);
                        color.setAlpha(this.color().alpha());
                        ctx.fillStyle = color.htmlRBGA();
                        ctx.fillRect(j * width + x, y, unitStep * width, height);
                    }
                }
        });
        this.lightnessSlider = new CustomBackgroundSlider(0, [150, slider_height], colorSlideEvent, 
            (ctx:CanvasRenderingContext2D, x:number, y:number, width:number, height:number) => {
                const color:RGB = new RGB(0, 0, 0, 0);
                if(this.color())
                {
                    const hsl:number[] = [this.hueSlider.state * 360, this.saturationSlider.state, this.lightnessSlider.state];
                    
                    const unitStep:number = 1 / width;
                    let i = 0;
                    for(let j = 0; j < 1; j += unitStep, i++)
                    {
                        hsl[2] = j;
                        color.setByHSL(hsl[0], hsl[1], hsl[2]);
                        color.setAlpha(this.color().alpha());
                        ctx.fillStyle = color.htmlRBGA();
                        ctx.fillRect(i + x, y, unitStep * width, height);
                    }
                }
        });
        this.localLayout.addElement(
            horizontal_group(
                [
                    new GuiButton(() => document.body.style.backgroundColor = "#4B4B4B", "Color:", 100, this.chosenColor.height(), 16),
                    this.chosenColor
                ])
            );

        this.localLayout.addElement(vertical_group(
            [
                horizontal_group(
                    [ 
                        new GuiLabel("Hue", 50, 16, slider_height), 
                        this.hueSlider
                    ]),
                horizontal_group(
                    [ 
                        new GuiLabel("Sat.", 50, 16, slider_height),
                        this.saturationSlider
                    ]),
                horizontal_group(
                    [ 
                        new GuiLabel("Light", 50, 16, slider_height),
                        this.lightnessSlider
                    ])
            ]));
        this.setColorText();
        this.hueSlider.refresh();
        this.saturationSlider.refresh();
        this.lightnessSlider.refresh();
        this.localLayout.trimDim();
        this.getOptionPanel()!.trimDim();
    }
    set_color(color:RGB):void
    {
        this.chosenColor.color.copy(color);
        const hsl = color.toHSL();
        this.hueSlider.setState(hsl[0] / 360);
        this.saturationSlider.setState(hsl[1]);
        this.lightnessSlider.setState(hsl[2]);
        this.hueSlider.refresh();
        this.saturationSlider.refresh();
        this.lightnessSlider.refresh();
        this.chosenColor.refresh();
    }
    color():RGB
    {
        return this.chosenColor.color;
    }
    setColorText():void
    {
        const color:RGB = this._setColorText();
        const hsl:number[] = color.toHSL();
        this.hueSlider.setState(hsl[0] / 360);
        this.saturationSlider.setState(hsl[1]);
        this.lightnessSlider.setState(hsl[2]);
    }
    _setColorText():RGB
    {
        const color:RGB = new RGB(0,0,0);
        if(this.color())
            color.copy(this.color());
        
        this.chosenColor.color.copy(color);
        return color;
    }
    activateOptionPanel():void { this.layoutManager.activate(); }
    deactivateOptionPanel():void { this.layoutManager.deactivate(); }
    getOptionPanel():SimpleGridLayoutManager | null {
        return this.layoutManager;
    }
    optionPanelSize():number[]
    {
        return [this.layoutManager.width(), this.layoutManager.height()];
    }
    drawOptionPanel(ctx:CanvasRenderingContext2D, x:number, y:number):void 
    {
        const optionPanel:SimpleGridLayoutManager = this.getOptionPanel()!;
        optionPanel.x = x;
        optionPanel.y = y;
        optionPanel.draw(ctx, x, y);
    }
};

class LayerManagerTool {
    list:GuiCheckList;
    layoutManager:SimpleGridLayoutManager;
    buttonAddLayer:GuiButton;
    runningId:number;
    static running_number:number = 0;
    layersLimit:number;
    callback_layer_count:() => number;
    callback_swap_layers:(l1:number, l2:number) => void;
    callback_slide_event:(layer:number, slider_value:number) => number;
    callback_add_layer:() => void;
    callback_delete_layer:(layer:number) => void;
    callback_checkbox_event:(layer:number, state:boolean) => void;
    callback_onclick_event:(layer:number) => void;
    callback_get_error_parallel_array:(layer:number) => string | null;
    callback_get_non_error_background_color:(layer:number) => RGB | null;

    constructor(limit:number = 5, callback_add_layer:() => void, 
    callback_checkbox_event:(layer:number, state:boolean) => void,
    callback_delete_layer:(layer:number) => void,
    callback_layer_count:() => number,
    callback_onclick_event:(layer:number) => void,
    callback_slide_event:(layer:number, slider_value:number) => number,
    callback_swap_layers:(l1:number, l2:number) => void,
    callback_get_error_parallel_array:(layer:number) => string | null,
    callback_get_non_error_background_color:(layer:number) => RGB | null)
    {
        this.callback_add_layer = callback_add_layer;
        this.callback_checkbox_event = callback_checkbox_event;
        this.callback_delete_layer = callback_delete_layer;
        this.callback_layer_count = callback_layer_count;
        this.callback_onclick_event = callback_onclick_event;
        this.callback_slide_event = callback_slide_event;
        this.callback_swap_layers = callback_swap_layers;
        this.callback_get_error_parallel_array = callback_get_error_parallel_array;
        this.callback_get_non_error_background_color = callback_get_non_error_background_color;
        this.layersLimit = limit;
        this.layoutManager = new SimpleGridLayoutManager([100, 24], [200, 530 - 130]);
        this.list = new GuiCheckList([1, this.layersLimit], [this.layoutManager.width(), 530 - 280], 20, false, this.callback_swap_layers,
        (event:SlideEvent) => {
            const index:number = this.list.list.findIndex(element => element.slider === event.element);
            this.callback_slide_event(index, event.value);
        }, callback_get_error_parallel_array, callback_get_non_error_background_color);
        this.buttonAddLayer = new GuiButton(() => { this.pushList(`x*x-${this.runningId++}`); this.callback_onclick_event(0) }, "Add Function", this.layoutManager.width() / 2, 75, 16);
        this.layoutManager.addElement(new GuiLabel("Functions list:", this.layoutManager.width(), 20));
        this.layoutManager.addElement(this.list);
        this.layoutManager.addElement(this.buttonAddLayer);
        this.layoutManager.addElement(new GuiButton(() => this.deleteItem(), "Delete", this.layoutManager.width() / 2, 75, 16));
    
        this.runningId = 2;
        this.pushList(`sin(x*x)`);
        this.list.refresh();
    }
    deleteItem(index:number = this.list.selected()):void
    {
        if(this.list.list.length > 1 && this.list.list[index]){
            this.list.delete(index);
            this.callback_delete_layer(index);
        }
    }
    pushList(text:string): void {
        if(this.list.list.length < this.layersLimit)
        {
            if(this.callback_layer_count() < this.list.list.length)
            {
                this.callback_add_layer();
            }
            this.list.push(text, true, (e) => {
                    const index:number = this.list.findBasedOnCheckbox(e.checkBox);
                    this.callback_checkbox_event(index, e.checkBox.checked);
                },
                (e) => {
                    this.list.list.forEach(el => el.textBox.deactivate());
                    if(this.list.selectedItem() && this.list.selectedItem()!.checkBox.checked)
                        this.list.selectedItem()!.textBox.activate();
                    this.callback_onclick_event(this.list.selected());
                });
                this.list.refresh();
        }
    }
    activateOptionPanel():void { this.layoutManager.activate(); }
    deactivateOptionPanel():void { this.layoutManager.deactivate(); }
    getOptionPanel():SimpleGridLayoutManager | null {
        return this.layoutManager;
    }
    optionPanelSize():number[]
    {
        return [this.layoutManager.width(), this.layoutManager.height()];
    }
    drawOptionPanel(ctx:CanvasRenderingContext2D, x:number, y:number):void
    {
        const optionPanel:SimpleGridLayoutManager = this.getOptionPanel()!;
        optionPanel.x = x;
        optionPanel.y = y;
        optionPanel.draw(ctx, x, y);
        if(this.callback_layer_count() !== this.list.list.length)
        {
            console.log("Error field layers out of sync with layers tool, attempting fix");
            this.list.list.length = 0;
        }
    }
};
window.addEventListener('load', function() {
    window.scrollTo(0, 1);
  });


class ViewTransformation {
    x_scale:number;
    y_scale:number;
    y_translation:number;
    x_translation:number;
    x_min :number;
    x_max :number;
    deltaX:number;
    y_min :number;
    y_max :number;
    deltaY:number;
    velocity:number[];
    acceleration:number[];
    constructor(x_scale:number, y_scale:number, x_translation:number, y_translation:number)
    {
        this.x_scale = x_scale;
        this.y_scale = y_scale;
        this.x_translation = x_translation;
        this.y_translation = y_translation;
        this.x_min = this.x_translation - 1 / this.x_scale;
        this.x_max = this.x_translation + 1 / this.x_scale;
        this.deltaX = this.x_max - this.x_min;
        this.y_min = this.y_translation - 1 / this.y_scale;
        this.y_max = this.y_translation + 1 / this.y_scale;
        this.deltaY = this.y_max - this.y_min;
        this.velocity = [0, 0];
        this.acceleration = [0, 0];
    }
    compare(target_bounds: ViewTransformation):boolean {
        return target_bounds.x_scale === this.x_scale && target_bounds.x_translation === this.x_translation && 
            target_bounds.y_scale === this.y_scale && target_bounds.y_translation === this.y_translation;
    }
    update_state(delta_time:number):void
    {
        const mult = delta_time / 1000;
        this.x_translation = clamp(this.x_translation + this.velocity[0] * mult, -max_32_bit_signed, max_32_bit_signed);
        this.y_translation = clamp(this.y_translation + this.velocity[1] * mult, -max_32_bit_signed, max_32_bit_signed);
        const velx_bounds = this.deltaX * 10;
        const vely_bounds = this.deltaY * 10;
        this.velocity[0] = clamp(this.velocity[0] + this.acceleration[0] * mult, -velx_bounds, velx_bounds);
        this.velocity[1] = clamp(this.velocity[1] + this.acceleration[1] * mult, -vely_bounds, vely_bounds);
        this.recalc();
    }
    stop_motion():void
    {
        this.velocity = [0, 0];
        this.acceleration = [0, 0];
    }
    recalc(x_scale:number = this.x_scale, y_scale:number = this.y_scale, x_translation:number = this.x_translation, y_translation:number = this.y_translation):void
    {
        this.x_scale = x_scale;
        this.y_scale = y_scale;
        this.x_translation = x_translation;
        this.y_translation = y_translation;
        this.x_min = this.x_translation - 1 / this.x_scale;
        this.x_max = this.x_translation + 1 / this.x_scale;
        this.deltaX = this.x_max - this.x_min;
        this.y_min = this.y_translation - 1 / this.y_scale;
        this.y_max = this.y_translation + 1 / this.y_scale;
        this.deltaY = this.y_max - this.y_min;
    }
    copy(other:ViewTransformation):ViewTransformation
    {
        this.recalc(other.x_scale, other.y_scale, other.x_translation, other.y_translation);
        return this;
    }
}
const black = new RGB(0, 0, 0, 255);
const white = new RGB(255, 255, 255, 255);
class Game extends SquareAABBCollidable {
    ui_state_manager:StateManagedUI;
    main_buf:Sprite;
    render_buf:Sprite;
    rendering:boolean;
    background_color:RGB;
    guiManager:SimpleGridLayoutManager;
    touchListener:SingleTouchListener;
    touchPos:number[];
    multi_touchListener:MultiTouchListener;
    repaint:boolean;
    cell_dim:number[];
    current_bounds:ViewTransformation;
    target_bounds:ViewTransformation;
    execution_time_delay:number;
    last_update_time:number;
    updates_per_second:number;

    life_checker:(ctx:Game, index:number, view:Int32Array) => boolean;
    
    constructor(multi_touchListener:MultiTouchListener, touchListener:SingleTouchListener, x:number, y:number, width:number, height:number, cell_dim:number[] = [200, 200])
    {
        super(x, y, width, height);
        this.last_update_time = Date.now();
        this.updates_per_second = 15;
        this.execution_time_delay = 10;
        this.repaint = true;
        this.rendering = false;
        this.multi_touchListener = multi_touchListener;
        this.touchListener = touchListener;
        const state = new StateManagedUIElement();
        state.layouts.push(this.guiManager);
        this.ui_state_manager = new StateManagedUI(state);
        this.touchPos = [multi_touchListener.single_touch_listener.touchPos[0], multi_touchListener.single_touch_listener.touchPos[1]];

        const whratio = width / (height > 0 ? height : width);
        this.target_bounds = new ViewTransformation(1 / width, 1 / height  * whratio, width / 2, -height / 2);
        this.current_bounds = new ViewTransformation(1, 1 * whratio, width / 2, -height / 2);

        const rough_dim = getWidth();
        this.background_color = new RGB(0, 0, 0, 0);
        this.cell_dim = [cell_dim[0], cell_dim[1]];
        this.init(width, height, this.cell_dim[0], this.cell_dim[1]);
        this.guiManager = new HorizontalLayoutManager([200, getHeight()], 2, 2);

        this.main_buf = this.new_sprite();
        //this.main_buf.ctx.fillStyle = black.htmlRBG();
        //this.main_buf.ctx.fillRect(0, 0, this.width, this.height);
        //this.render_buf = this.new_sprite();
        
        this.repaint = true;
        this.life_checker = (ctx:Game, index:number, view:Int32Array) => {
            let sum_on = 0;
            for(let i = -1; i <= 1; i++)
            {
                const row = index + i * ctx.cell_dim[0];
                for(let j = -1; j <= 1; j++)
                {
                    sum_on += +(view[row + j] == white.color);
                }
            }
            sum_on -= +(view[index] == white.color);
            if(view[index] == black.color)
                return sum_on === 3 ? true : false;
            else
                return ((view[index] == white.color) && (sum_on === 2 || sum_on === 3));
        };
    }
    init(width:number, height:number, cell_width:number, cell_height:number):void
    {
        const whratio = width / (height > 0 ? height : width);
        this.target_bounds.y_scale = this.target_bounds.x_scale * whratio;
        this.resize(width, height);

        this.background_color = new RGB(0, 0, 0, 0);
        this.cell_dim = [cell_width, cell_height];
        this.main_buf = this.new_sprite();
        //this.main_buf.ctx.fillStyle = black.htmlRBG();
        //this.main_buf.ctx.fillRect(0, 0, this.width, this.height);
        this.render_buf = this.new_sprite();
        this.repaint = true;
    }
    set_gui_position(x:number = this.guiManager.x, y:number = this.guiManager.y):void
    {
        this.guiManager.x = x;
        this.guiManager.y = y;
    }
    calc_bounds():void
    {
        this.target_bounds.recalc();
    }
    set_place(index:number, color:number, view:Int32Array = new Int32Array(this.main_buf.imageData!.data.buffer)):boolean
    {
        if(view[index] !== undefined)
        {
            view[index] = color;
            return true;
        }
        return false;
    }
    get_place(index:number, view:Int32Array = new Int32Array(this.main_buf.imageData!.data.buffer)):number | null
    {
        if(view[index] !== undefined)
        {
            return view[index];
        }
        return null;
    }
    is_background(index:number):boolean
    {
        const view = new Int32Array(this.main_buf.imageData!.data.buffer);
        return this.get_place(index) == this.background_color.color;
    }
    clear_place(removed:number):boolean
    {
        const view = new Int32Array(this.main_buf.imageData!.data.buffer);
        if(view[removed] !== undefined)
        {
            view[removed] = this.background_color.color;
            return true;
        }
        return false;
    }
    restart_game():void
    {
        this.init(this.width, this.height, this.cell_dim[0], this.cell_dim[1]);
    }
    new_sprite():Sprite
    {   
        const pixels = (new Array<RGB>(this.cell_dim[1] * this.cell_dim[0])).fill(black, 0, this.cell_dim[1] * this.cell_dim[0]);
        return new Sprite(pixels, this.cell_dim[0], this.cell_dim[1], false);
    }
    
    resize(width:number, height:number):void
    {
        this.width = width;
        this.height = height;
        this.calc_bounds();
    }
    static _colores:RGB[] = [new RGB(231, 76, 60),
        new RGB(225, 180, 25),
        new RGB(55, 152, 219),
        new RGB(182, 12, 255),
        new RGB(46, 204, 113),
        new RGB(245, 146, 65),
        new RGB(51, 204, 0)];
    async regenerate_curve_view():Promise<void>
    {
        const main_buf = this.render_buf;
        this.rendering = true;
        this.calc_bounds();
        const target_bounds = new ViewTransformation(1,1,1,1);
        target_bounds.copy(this.target_bounds);
        main_buf.ctx.clearRect(0, 0, main_buf.width, main_buf.height);
        main_buf.ctx.drawImage(this.main_buf.image, 0, 0);

        this.calc_bounds();
        if(!keyboardHandler.keysHeld["KeyP"])
        {
            const read_view = new Int32Array(this.main_buf.imageData!.data.buffer);
            const write_view = new Int32Array(main_buf.imageData!.data.buffer);
            for(let i = 0; i < read_view.length; i++)
            {
                write_view[i] = this.life_checker(this, i, read_view) ? white.color : black.color;
            }
        }
        //a bitmap to be manipulated
        main_buf.refreshImage();
        this.rendering = false;
        const buf = this.render_buf;
        this.render_buf = this.main_buf;
        this.main_buf = buf;
        this.current_bounds.copy(target_bounds);
    }
    update_touch_pos():void
    {
        this.touchPos[0] = this.multi_touchListener.single_touch_listener.touchPos[0]
        this.touchPos[1] = this.multi_touchListener.single_touch_listener.touchPos[1];
    }
    draw(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void 
    {
        const font_size = 24;
        if(+ctx.font.split("px")[0] != font_size)
        {
            ctx.font = `${font_size}px Helvetica`;
        }
        const dx = (this.current_bounds.x_translation - this.target_bounds.x_translation) / this.target_bounds.deltaX * this.width;
        const dy = (this.current_bounds.y_translation - this.target_bounds.y_translation) / this.target_bounds.deltaY * this.height;
        
        const rx = this.target_bounds.x_scale / this.current_bounds.x_scale * width;
        const ry = this.target_bounds.y_scale / this.current_bounds.y_scale * height;
        const dw = this.width - rx;
        const dh = this.height - ry;
        this.calc_bounds();
        ctx.imageSmoothingEnabled = false;
        //render current curve view
        //ctx.drawImage(this.main_buf.image, this.target_bounds.x_min, this.target_bounds.y_min, this.target_bounds.deltaX, this.target_bounds.deltaY, x + dx + dw / 2, y + dy + dh / 2, rx, ry);
        ctx.drawImage(this.main_buf.image, this.target_bounds.x_min, this.target_bounds.y_min, this.target_bounds.deltaX, this.target_bounds.deltaY, x, y, width, height);
        //ctx.drawImage(this.main_buf.image, 0 , 0);

    }
    world_x_to_screen(x:number, bounds:ViewTransformation = this.target_bounds):number
    {
        return (x - bounds.x_min) / bounds.deltaX * this.main_buf.width;
    }
    world_y_to_screen(y:number, bounds:ViewTransformation = this.target_bounds):number
    {
        return (-y - bounds.y_min) / bounds.deltaY * this.main_buf.height;
    }
    auto_round_world_x(x:number):number
    {
        const logarithm = Math.log10(Math.abs(x));
        const rounded = Math.round(x * (Math.pow(1, -logarithm) * 100)) * Math.floor(Math.pow(1, logarithm)) / 100;
        return rounded;
    }
    round(value:number, places:number):number
    {
        return +(""+Math.round(value * Math.pow(10, places)) * Math.pow(10, -places)).substring(0, places + 1);
    }
    render_x_y_label_screen_space(ctx:CanvasRenderingContext2D, touchPos:number[], precision:number = 2):void
    {
        const world_x = ((touchPos[0] / this.width) * this.target_bounds.deltaX + this.target_bounds.x_min);
        const world_y = ((touchPos[1] / this.height) * this.target_bounds.deltaY + this.target_bounds.y_min);
        this.render_formatted_point(ctx, world_x, -world_y, touchPos[0], touchPos[1], precision);
    }
    render_x_y_label_world_space(ctx:CanvasRenderingContext2D, world_x:number, world_y:number, precision:number = 1, offset_y:number = 0):void
    {
        const screen_x = ((world_x - this.target_bounds.x_min) / this.target_bounds.deltaX) * this.width;
        const screen_y = clamp(((-world_y - this.target_bounds.y_min) / this.target_bounds.deltaY) * this.height, 30, this.height);
        this.render_formatted_point(ctx, world_x, world_y, screen_x, screen_y, precision, offset_y);
    }
    render_formatted_point(ctx:CanvasRenderingContext2D, world_x:number, world_y:number, screen_x:number, screen_y:number, precision:number = 2, offset_y:number = 0):void
    {
        ctx.lineWidth = 2.5;
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#B4B4B4";
        const dim = 7;
        ctx.fillRect(screen_x - dim / 2, screen_y - dim / 2, dim, dim);
        ctx.strokeRect(screen_x - dim / 2, screen_y - dim / 2, dim, dim);
        let text:string;
        const decimal = Math.abs(world_x) < 1 << 16 && Math.abs(world_x) > Math.pow(2, -20) || Math.abs(world_x) < Math.pow(2, -35);
        try {
            text = `x: ${decimal ? round_with_precision(world_x, precision + 2) : world_x.toExponential(precision)} y: ${
                decimal ? round_with_precision(world_y, precision + 2) : world_y.toExponential(precision)}`;
            
            const text_width = ctx.measureText(text).width; 
            const font_size = +ctx.font.split('px')[0];           
            if(text_width + screen_x + dim > this.width)
            {
                screen_x -= text_width + dim * 2;
                screen_y += 3;
            }
            //add bounding to labels to prevent rendering off screen
            if(text_width + screen_x > this.main_buf.width)
                screen_x = this.main_buf.width - text_width - 10;
            else if(screen_x < 0)
                screen_x = 5;
            if(screen_y - font_size < 0)
                screen_y = font_size * 2;
            else if(screen_y > this.main_buf.height)
                screen_y = this.main_buf.height - font_size;
            ctx.strokeText(text, screen_x + dim, screen_y + dim / 2 + offset_y);
            ctx.fillText(text, screen_x + dim, screen_y + dim / 2 + offset_y);
            ctx.lineWidth = 1;
            ctx.fillStyle = "#FFFFFF";
            ctx.strokeStyle = "#000000";
        } catch(error:any)
        {
            console.log(error.message);
        }
    }
    format_number(value:number, precision:number = 2):string
    {
        const dim = 10;
        let text:string;
        if(Math.abs(value) < 1 << 16 && Math.abs(value) > 0.0001)
            text = `${round_with_precision(value, precision + 2)}`;
        else
            text = `${value.toExponential(precision)}`;            
        return text;
    }
    cell_dist(cell1:number, cell2:number):number
    {
        const c1x = cell1 % this.cell_dim[0];
        const c1y = Math.floor(cell1 / this.cell_dim[0]);
        const c2x = cell2 % this.cell_dim[0];
        const c2y = Math.floor(cell2 / this.cell_dim[0]);
        //return (Math.abs(c1x - c2x) + Math.abs(c1y - c2y));
        return Math.sqrt(Math.pow(c1x - c2x, 2) + Math.pow(c1y - c2y, 2));
    }
    column(cell):number
    {
        return cell % this.cell_dim[0];
    }
    row(cell):number
    {
        return Math.floor(cell / this.cell_dim[0]);
    }
    screen_to_index(x:number, y:number):number
    {
        const x_scale = 1 / this.width * this.cell_dim[0];
        const y_scale = 1 / this.height * this.cell_dim[1];
        x *= x_scale;
        y *= y_scale;
        return Math.floor(x) + Math.floor(y) * this.cell_dim[0];
    }
    screen_to_world(coords:number[]):number[]
    {
        return [(coords[0] / this.width * this.target_bounds.deltaX + this.target_bounds.x_min),
                    (coords[1] / this.height * this.target_bounds.deltaY + this.target_bounds.y_min)];
    }
    fill(start:number, color_p:number):void
    {
        this.traverse_df(start, 
            (index, color) => color_p, 
                (index, color) => color == this.background_color.color);
    }
    traverse_df(start:number, apply:(index:number, color:number) => number, verifier:(index:number, color:number) => boolean):void
    {
        const view:Int32Array = new Int32Array(this.main_buf.imageData!.data.buffer);
        const checked_map:Int32Array = new Int32Array(view.length);
        checked_map.fill(0, 0, checked_map.length);
        const stack:number[] = [];
        stack.push(start);
        while(stack.length > 0)
        {
            const current = stack.pop()!;
            if(!checked_map[current] && verifier(current, view[current]))
            {
                checked_map[current] = 1;
                view[current] = apply(current, view[current]);
                
                if(checked_map[current + 1] === 0  && this.row(current + 1) === this.row(current) && view[current + 1] !== undefined)
                {
                    stack.push(current + 1);
                }
                if(checked_map[current - 1] === 0  && this.row(current - 1) === this.row(current) && view[current - 1] !== undefined)
                {
                    stack.push(current - 1);
                }
                if(checked_map[current + this.cell_dim[0]] === 0 && this.column(current + this.cell_dim[0]) === this.column(current) && view[current + this.cell_dim[0]] !== undefined)
                {
                    stack.push(current + this.cell_dim[0]);
                }
                if(checked_map[current - this.cell_dim[0]] === 0 && this.column(current - this.cell_dim[0]) === this.column(current) && view[current - this.cell_dim[0]] !== undefined)
                {
                    stack.push(current - this.cell_dim[0]);
                }
            }
        }
    }
    update_state(delta_time: number): void 
    {
        this.update_touch_pos();
        delta_time++;
        const mod_x = (1000 / delta_time) * this.target_bounds.deltaX / 30;
        const mod_y = (1000 / delta_time) * this.target_bounds.deltaY / 30;
        if(keyboardHandler.keysHeld["ArrowUp"])
                this.target_bounds.acceleration[1] = -mod_y;
        else if(!keyboardHandler.keysHeld["ArrowDown"])
            this.target_bounds.acceleration[1] = -this.target_bounds.velocity[1] * 3;
        
        if(keyboardHandler.keysHeld["ArrowDown"])
                this.target_bounds.acceleration[1] = mod_y;

        if(keyboardHandler.keysHeld["ArrowLeft"])
        {
                this.target_bounds.acceleration[0] = -mod_x;
        }
        else if(!keyboardHandler.keysHeld["ArrowRight"])
            this.target_bounds.acceleration[0] = -this.target_bounds.velocity[0] * 3;
        
        if(keyboardHandler.keysHeld["ArrowRight"])
                this.target_bounds.acceleration[0] = mod_x;

        this.target_bounds.update_state(delta_time);
        if(Date.now() - this.last_update_time > 1000 / this.updates_per_second && !this.rendering)
        {
            this.last_update_time = Date.now();
            this.repaint = false;
            this.regenerate_curve_view();
        }
    }
    world_to_screen(point:number[]):number[]
    {
        return [(point[0] - this.target_bounds.x_min) / this.target_bounds.deltaX, 
            (point[1] - this.target_bounds.y_min) / this.target_bounds.deltaY];
    }
    normalize_point_in_camera(p:number[]):number[]
    {
        return [(p[0] - this.target_bounds.x_min) / this.target_bounds.deltaX, (p[1] - this.target_bounds.y_min) / this.target_bounds.deltaY];
    }
    round_to_grid(p:number[], cells:number[]):number[]
    {
        const normalized = this.normalize_point_in_camera(p);
        const final = [(Math.floor(normalized[0] * cells[0]) * (this.target_bounds.deltaX / cells[0])) + this.target_bounds.x_min, 
            (Math.floor(normalized[1] * cells[1]) * (this.target_bounds.deltaY / cells[1])) + this.target_bounds.y_min];
        return final;
    }
    draw_boundary(x1:number, x2:number, y1:number, y2:number, color:number = white.color, view:Int32Array = new Int32Array(this.main_buf.imageData!.data.buffer)):void
    {
        [x1, y1] = this.screen_to_world([x1, y1]);
        [x2, y2] = this.screen_to_world([x2, y2]);
        //draw line from current touch pos to the touchpos minus the deltas
        //calc equation for line
        const deltaY = Math.ceil(y2 - y1);
        const deltaX = Math.ceil(x2 - x1);
        const m:number = deltaY/deltaX;
        const b:number = y2-m*x2;
        const delta:number = 0.01;
        if(Math.abs(deltaX) > Math.abs(deltaY))
        {
            const min:number = Math.min(x1, x2);
            const max:number = Math.max(x1, x2);
            let error:number = 0;
            for(let x = min; x < max; x+=delta)
            {
                let y:number = Math.abs(deltaX) > 0 ? m*(x) + b : y2;
                view[Math.floor(x) + Math.floor(y) * this.main_buf.width] = color;
            }
        }
        else
        {
            const min:number = Math.min(y1, y2);
            const max:number = Math.max(y1, y2);
            for(let y = min; y < max; y+=delta)
            {
                const x:number = Math.abs(deltaX)>0?(y - b)/m:x2;
                view[Math.floor(x) + Math.floor(y) * this.main_buf.width] = color;
            }
        }
    }
    set_scale(x_scale:number, y_scale:number, keep_in_place:number[] = this.touchPos):void
    {
        const old_worldPos = this.screen_to_world(keep_in_place);
        this.target_bounds.x_scale = clamp(x_scale, 1 / max_32_bit_signed, max_32_bit_signed);
        this.target_bounds.y_scale = clamp(y_scale, 1 / max_32_bit_signed, max_32_bit_signed);
        this.calc_bounds();
        const new_worldPos = this.screen_to_world(keep_in_place);
        const dx = (new_worldPos[0] - old_worldPos[0]);
        const dy = (new_worldPos[1] - old_worldPos[1]);
        
        this.target_bounds.x_translation -= dx;
        this.target_bounds.y_translation -= dy;
    }
};
const keyboardHandler = new KeyboardHandler();
async function main()
{
    const canvas:HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("screen");
    const touchListener = new SingleTouchListener(canvas, false, true, false);
    const multi_touch_listener = new MultiTouchListener(canvas, isTouchSupported(), true, false);

    canvas.onmousemove = (event:MouseEvent) => {
    };
    const clamp_x = (x:number) => clamp(x, game.target_bounds.x_scale / 2, game.target_bounds.x_scale * 2);
    const clamp_y = (x:number) => clamp(x, game.target_bounds.y_scale / 2, game.target_bounds.y_scale * 2);
    const calc_scale = (scale, normalized_delta, clamp) => {
        scale -= normalized_delta * scale;
        return clamp(scale);
    }
    canvas.addEventListener("wheel", (e) => {
        if(Math.abs(e.deltaY) > 1000)
            return;
        const normalized_delta = (clamp(e.deltaY + 1, -getHeight(), getHeight())) / getHeight();
        game.set_scale(calc_scale(game.target_bounds.x_scale, normalized_delta, clamp_x), calc_scale(game.target_bounds.y_scale, normalized_delta, clamp_y));
        game.repaint = true;
    }, { passive:true });
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
    }, { passive:false });
    canvas.style.cursor = "pointer";
    multi_touch_listener.registerCallBackPredicate("pinch", () => true, (event:MultiTouchEvent) => {
        const normalized_delta = event.delta / Math.max(getHeight(), getWidth());
        game.set_scale(calc_scale(game.target_bounds.x_scale, normalized_delta, clamp_x), calc_scale(game.target_bounds.y_scale, normalized_delta, clamp_y),
            event.touchPos);
        game.repaint = true;
        event.preventDefault();
    });
    let width = getWidth();
    let height = getHeight();
    canvas.width = width;
    canvas.height = height;
    let game = new Game(multi_touch_listener, touchListener, 0, 0, height, width);
    window.game = game;
    let fps_text_width = 0;
    let render_fps = false;
    let low_fps:boolean = true;

    multi_touch_listener.registerCallBack("touchstart", (event:TouchMoveEvent) => {
        game.guiManager.handleTouchEvents("touchstart", event);
        if(event.touchPos[0] > (game.width - fps_text_width - 10) && event.touchPos[1] < +ctx.font.split('px')[0] * 1.2)
            render_fps = !render_fps;
    });
    multi_touch_listener.registerCallBackPredicate("touchend", (event:any) => true, (event:TouchMoveEvent) => {
        game.guiManager.handleTouchEvents("touchend", event);
        //game.draw_boundary(event.touchPos[0] - event.deltaX, event.touchPos[0], event.touchPos[1] - event.deltaY, event.touchPos[1]);
        
    });
    multi_touch_listener.registerCallBackPredicate("touchmove", (event:any) => true, (event:TouchMoveEvent) => {
        game.guiManager.handleTouchEvents("touchmove", event);
        game.draw_boundary(event.touchPos[0] - event.deltaX, event.touchPos[0], event.touchPos[1] - event.deltaY, event.touchPos[1]);
        game.repaint = true;
    });
    keyboardHandler.registerCallBack("keyup", () => true, (event:any) => {
        game.guiManager.handleKeyBoardEvents("keyup", event);
    });
    keyboardHandler.registerCallBack("keydown", () => true, (event:any) => {
        if(!keyboardHandler.keysHeld["MetaLeft"] && !keyboardHandler.keysHeld["ControlLeft"] &&
            !keyboardHandler.keysHeld["MetaRight"] && !keyboardHandler.keysHeld["ControlRight"])
            event.preventDefault();
        game.guiManager.handleKeyBoardEvents("keydown", event);
        switch(event.code)
        {
            case("KeyF"):
            render_fps = !render_fps;
            break;
            case("KeyQ"):
            game.target_bounds.x_translation = 0;
            game.target_bounds.y_translation = 0;
            break;
        }
    });
    let maybectx:CanvasRenderingContext2D | null = canvas.getContext("2d", {desynchronized:true});
    if(!maybectx)
        return;
    const ctx:CanvasRenderingContext2D = maybectx;
    let start = Date.now();
    let dt = 1;
    const ostart = Date.now();
    let frame_count = 0;
    let instantaneous_fps = 0;
    const time_queue:FixedSizeQueue<number> = new FixedSizeQueue<number>(60 * 2);
    const header = document.getElementById("header");
    srand(Math.random() * max_32_bit_signed);

    const drawLoop = () => 
    {
        frame_count++;
        //do stuff and render here
        if(getWidth() !== width || getHeight() !== height)
        {
            width = getWidth();
            height = getHeight();

            canvas.width = width;
            canvas.height = height;
            game.init(width, height, width, height - 10);
        }
        dt = Date.now() - start;
        time_queue.push(dt);
        start = Date.now();
        let sum = 0;
        let highest = 0;
        for(let i = 0; i < time_queue.length; i++)
        {
            const value = time_queue.get(i);
            sum += value;
            if(highest < value)
            {
                highest = value;
            }
        }
        game.update_state(dt);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.draw(canvas, ctx, game.x, game.y, game.width, game.height);
        if(frame_count % 10 === 0)
            instantaneous_fps = Math.floor(1000 / (low_fps?highest:dt));
        let text = "";
        ctx.fillStyle = "#FFFFFF";
        text = `avg fps: ${Math.floor(1000 * time_queue.length / sum)}, ${low_fps?"low":"ins"} fps: ${instantaneous_fps}`;
        fps_text_width = ctx.measureText(text).width;
        if(render_fps)
        {
            ctx.strokeText(text, game.width - fps_text_width - 10, menu_font_size());
            ctx.fillText(text, game.width - fps_text_width - 10, menu_font_size());
        }
        game.execution_time_delay =  sum / time_queue.length / 10;
        requestAnimationFrame(drawLoop);
    }
    drawLoop();

}
main();